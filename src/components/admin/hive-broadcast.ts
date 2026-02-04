// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { ReplyOperation } from '@hiveio/wax'
import { configureEndpoints, DataProvider, getWax } from '@hiveio/workerbee/blog-logic'
import { CONFIG_PARENT_AUTHOR, CONFIG_PARENT_PERMLINK, HIVE_API_ENDPOINTS } from '../../lib/config'

// Configure workerbee to use our custom Hive API endpoints
configureEndpoints(HIVE_API_ENDPOINTS)
import { getOnlineClient } from '../../lib/hbauth-service'
import type { SettingsData } from './types/index'

const MAX_BODY_SIZE = 64 * 1024 // 64KB in bytes

/**
 * Retry wrapper for async operations with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      // Retry logic - silent on failure, will throw if all retries exhausted

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, 8s...
        const backoffDelay = delayMs * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, backoffDelay))
      }
    }
  }

  throw lastError
}

/**
 * Find existing config comment from a user under the config post using Blog Logic
 * Returns the permlink and body if found, null otherwise
 */
async function findExistingConfig(username: string): Promise<{ permlink: string; body: string } | null> {
  try {
    const chain = await getWax()
    const dataProvider = new DataProvider(chain)

    // Use Blog Logic's enumReplies to fetch all replies to the config post
    // This uses bridge.get_discussion internally with retry logic
    const repliesIds = await dataProvider.enumReplies(
      { author: CONFIG_PARENT_AUTHOR, permlink: CONFIG_PARENT_PERMLINK },
      {},
      { page: 1, pageSize: 100 }
    )

    // Find this user's config comment
    for (const replyId of repliesIds) {
      if (replyId.author === username) {
        // Get the cached comment data
        const comment = dataProvider.getComment(replyId)
        if (comment?.body.includes('```json')) {
          return {
            permlink: comment.permlink,
            body: comment.body
          }
        }
      }
    }

    return null
  } catch (error) {
    if (import.meta.env.DEV) console.error('Error finding existing config:', error)
    return null
  }
}

/**
 * Generate a new unique permlink for config
 */
function generateNewConfigPermlink(username: string): string {
  const timestamp = Date.now()
  return `blog-config-${username}-${timestamp}`
}

/**
 * Broadcast settings as a comment to Hive blockchain using HB-Auth
 * Uses HB-Auth for signing - key is managed securely in IndexedDB
 */
export async function broadcastConfigToHive(
  settings: SettingsData,
  username: string,
  _privateKey: string // Kept for API compatibility, but ignored - HB-Auth manages the key
): Promise<{ success: boolean; txId?: string; permlink?: string; isUpdate?: boolean; error?: string }> {
  try {
    const chain = await getWax()
    const authClient = await getOnlineClient()

    // Verify user is authenticated with HB-Auth
    const registeredUser = await authClient.getRegisteredUserByUsername(username)
    if (!registeredUser) {
      throw new Error('User not registered in HB-Auth. Please login first.')
    }

    if (!registeredUser.unlocked) {
      throw new Error('Wallet is locked. Please unlock with your password first.')
    }

    // Check if user already has a config comment under this post
    const existingConfig = await findExistingConfig(username)
    const isUpdate = !!existingConfig

    // Use existing permlink for update, or generate new one for create
    const permlink = existingConfig ? existingConfig.permlink : generateNewConfigPermlink(username)

    // Prepare config body
    const configBody = JSON.stringify(settings, null, 2)
    const timestamp = new Date().toISOString()

    // Validate config size (Hive has 64KB limit on comment body)
    const fullBody = `# Blog Configuration for @${username}\n\nLast updated: ${timestamp}\n\n\`\`\`json\n${configBody}\n\`\`\``
    const bodySize = new Blob([fullBody]).size
    if (bodySize > MAX_BODY_SIZE) {
      throw new Error(`Configuration too large (${Math.round(bodySize / 1024)}KB). Maximum size is 64KB. Try reducing custom settings.`)
    }

    // Create transaction
    const tx = await chain.createTransaction()

    // Add reply operation - same operation for create and update
    // In Hive, posting a comment with the same author+permlink updates it
    tx.pushOperation(new ReplyOperation({
      parentAuthor: CONFIG_PARENT_AUTHOR,
      parentPermlink: CONFIG_PARENT_PERMLINK,
      author: username,
      body: fullBody,
      permlink: permlink,
      jsonMetadata: {
        app: 'hive-blog-config/1.0',
        format: 'markdown',
        tags: ['hive-blog-config'],
        config_version: '1.0',
        updated_at: timestamp,
      }
    }))

    // Get the transaction digest for signing
    const digest = tx.sigDigest

    // Sign with HB-Auth (key never leaves IndexedDB)
    const signature = await authClient.sign(username, digest, 'posting')

    // Add signature to transaction
    tx.addSignature(signature)

    // Broadcast with retry logic (max 3 attempts with exponential backoff)
    await withRetry(
      async () => await chain.broadcast(tx),
      3, // max 3 retries
      1000 // 1s initial delay
    )

    return {
      success: true,
      txId: tx.id,
      permlink: permlink,
      isUpdate: isUpdate
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to broadcast config:', error)

    // Parse error for user-friendly message
    let errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check for RC (Resource Credits) error
    if (errorMessage.includes('not_enough_rc') || errorMessage.includes('RC mana')) {
      errorMessage = 'Not enough Resource Credits (RC). Please wait for RC to regenerate or power up more HIVE.'
    }

    // Check for HB-Auth errors
    if (errorMessage.includes('Not authorized') || errorMessage.includes('not unlocked')) {
      errorMessage = 'Session expired. Please login again.'
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Load config from Hive blockchain for a specific user
 */
export async function loadConfigFromHive(username: string): Promise<SettingsData | null> {
  try {
    const existingConfig = await findExistingConfig(username)

    if (!existingConfig) {
      return null
    }

    // Extract JSON from markdown code block
    const jsonMatch = existingConfig.body.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) {
      return null
    }

    const config = JSON.parse(jsonMatch[1]) as SettingsData
    return config
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to load config from Hive:', error)
    return null
  }
}

/**
 * Get the URL to the config comment on Hive (if exists)
 */
export async function getConfigUrl(username: string): Promise<string | null> {
  const existingConfig = await findExistingConfig(username)
  if (!existingConfig) {
    return null
  }
  return `https://peakd.com/@${username}/${existingConfig.permlink}`
}

/**
 * Get URL synchronously (for display after publish)
 */
export function getConfigUrlSync(username: string, permlink: string): string {
  return `https://peakd.com/@${username}/${permlink}`
}
