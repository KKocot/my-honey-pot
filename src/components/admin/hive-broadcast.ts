// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { ReplyOperation } from '@hiveio/wax'
import { configureEndpoints, DataProvider, getWax } from '@hiveio/workerbee/blog-logic'
import {
  CONFIG_PARENT_AUTHOR,
  CONFIG_PARENT_PERMLINK,
  HIVE_API_ENDPOINTS,
  IS_COMMUNITY,
  APPEARANCE_CONFIG_TYPE,
  APPEARANCE_CONFIG_PREFIX,
  LEGACY_CONFIG_APP,
  DOCKER_CONFIG_TYPE,
  DOCKER_CONFIG_PREFIX,
} from '../../lib/config'
import { get_broadcast_chain } from '../../lib/broadcast-chain'

// Configure workerbee to use our custom Hive API endpoints
configureEndpoints(HIVE_API_ENDPOINTS)

import { sign_transaction } from '../../lib/transaction-signer'
import type { SettingsData } from './types/index'
import { defaultSettings, strip_community_fields } from './types/index'
import { settings_schema } from './types/settings-schema'
import { with_retry } from '../../lib/retry'

const MAX_BODY_SIZE = 64 * 1024 // 64KB in bytes

/** Result from findExistingConfig with parsed json_metadata for merge logic */
interface ExistingConfigResult {
  permlink: string
  body: string
  json_metadata: Record<string, unknown>
}

/**
 * Find existing config comment from a user under the config post using Blog Logic.
 * Returns the permlink, body and parsed json_metadata if found, null otherwise.
 *
 * Search priority:
 * 1. Our own appearance config (type === APPEARANCE_CONFIG_TYPE, prefix !hive-blog-appearance)
 * 2. Docker service config (type === DOCKER_CONFIG_TYPE, prefix !hive-blog-docker)
 * 3. Legacy match (backwards compat: app field + json code block)
 */
async function findExistingConfig(username: string): Promise<ExistingConfigResult | null> {
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
    // Priority: appearance config > docker service config > legacy match
    let docker_match: ExistingConfigResult | null = null
    let legacy_match: ExistingConfigResult | null = null

    for (const replyId of repliesIds) {
      if (replyId.author !== username) continue

      const comment = dataProvider.getComment(replyId)
      if (!comment) continue

      const metadata: Record<string, unknown> = comment.json_metadata ?? {}

      // Priority 1: our own appearance config
      if (metadata.type === APPEARANCE_CONFIG_TYPE && comment.body.startsWith(APPEARANCE_CONFIG_PREFIX)) {
        return { permlink: comment.permlink, body: comment.body, json_metadata: metadata }
      }

      // Priority 2: docker service config (created by hive-blog-service)
      if (
        !docker_match &&
        metadata.type === DOCKER_CONFIG_TYPE &&
        comment.body.startsWith(DOCKER_CONFIG_PREFIX)
      ) {
        docker_match = { permlink: comment.permlink, body: comment.body, json_metadata: metadata }
      }

      // Priority 3: legacy match (backwards compat)
      if (
        !legacy_match &&
        metadata.app === LEGACY_CONFIG_APP &&
        comment.body.includes('```json')
      ) {
        legacy_match = { permlink: comment.permlink, body: comment.body, json_metadata: metadata }
      }
    }

    return docker_match ?? legacy_match
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
 * Broadcast settings as a comment to Hive blockchain.
 * Supports two signing modes:
 * - HB-Auth (production): key managed securely in IndexedDB
 * - Direct WIF (dev/mirrornet): raw WIF signing via beekeeper
 */
export async function broadcastConfigToHive(
  settings: SettingsData,
  username: string,
  privateKey: string
): Promise<{ success: boolean; txId?: string; permlink?: string; isUpdate?: boolean; error?: string }> {
  try {
    const chain = await get_broadcast_chain()

    // Check if user already has a config comment under this post
    const existingConfig = await findExistingConfig(username)
    const isUpdate = !!existingConfig

    // Use existing permlink for update, or generate new one for create
    const permlink = existingConfig ? existingConfig.permlink : generateNewConfigPermlink(username)

    // Prepare config body
    const configBody = JSON.stringify(settings, null, 2)
    const timestamp = new Date().toISOString()

    // Escape backticks in config body to prevent breaking the markdown code block
    const safe_config_body = configBody.replaceAll('```', '\\`\\`\\`');

    // Validate config size (Hive has 64KB limit on comment body)
    const fullBody = `${APPEARANCE_CONFIG_PREFIX}\n# Blog Configuration for @${username}\n\nLast updated: ${timestamp}\n\n\`\`\`json\n${safe_config_body}\n\`\`\``
    const bodySize = new Blob([fullBody]).size
    if (bodySize > MAX_BODY_SIZE) {
      throw new Error(`Configuration too large (${Math.round(bodySize / 1024)}KB). Maximum size is 64KB. Try reducing custom settings.`)
    }

    // Create transaction
    const tx = await chain.createTransaction()

    // Build json_metadata, preserving docker service fields when overwriting
    // a comment originally created by hive-blog-service
    const base_metadata: Record<string, unknown> = {
      app: LEGACY_CONFIG_APP,
      type: APPEARANCE_CONFIG_TYPE,
      format: 'markdown',
      tags: ['hive-blog-config'],
      config_version: '1.0',
      updated_at: timestamp,
    }

    // If we're overwriting a docker service comment, preserve its infra fields
    if (existingConfig?.json_metadata.type === DOCKER_CONFIG_TYPE) {
      const docker_meta = existingConfig.json_metadata
      if (docker_meta.container !== undefined) base_metadata.container = docker_meta.container
      if (docker_meta.subdomain !== undefined) base_metadata.subdomain = docker_meta.subdomain
      if (docker_meta.instance_type !== undefined) base_metadata.instance_type = docker_meta.instance_type
    }

    // Add reply operation - same operation for create and update
    // In Hive, posting a comment with the same author+permlink updates it
    tx.pushOperation(new ReplyOperation({
      parentAuthor: CONFIG_PARENT_AUTHOR,
      parentPermlink: CONFIG_PARENT_PERMLINK,
      author: username,
      body: fullBody,
      permlink: permlink,
      jsonMetadata: base_metadata,
    }))

    // Sign transaction (Keychain / WIF / HB-Auth)
    await sign_transaction(tx, username, privateKey)

    // Broadcast with retry logic (max 3 attempts with exponential backoff)
    await with_retry(
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
 * Load raw config from Hive blockchain -- only fields actually saved.
 * Does NOT apply Zod defaults, does NOT strip community fields.
 * Returns a Partial<SettingsData> so callers know which fields were explicit.
 *
 * This is the foundation of the unified config pipeline (config-pipeline.ts).
 */
export async function load_raw_config_from_hive(
  username: string
): Promise<Partial<SettingsData> | null> {
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

    const raw: unknown = JSON.parse(jsonMatch[1])

    // Basic shape validation -- reject completely invalid payloads
    // but do NOT apply Zod defaults (that would mask missing fields)
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      if (import.meta.env.DEV) {
        console.warn("Invalid config shape from blockchain (not an object)")
      }
      return null
    }

    // Validate with Zod schema to reject bad field types,
    // but extract only the keys that were present in raw JSON
    const result = settings_schema.safeParse(raw)

    if (!result.success) {
      if (import.meta.env.DEV) {
        console.warn(
          "Invalid config from blockchain, using defaults:",
          result.error.issues
        )
      }
      return null
    }

    // Return only the fields that actually existed in the raw JSON.
    // This prevents Zod defaults from overriding mode-specific defaults.
    // After the guard above, `raw` is narrowed to `object` (non-null, non-array).
    const raw_keys = new Set(Object.keys(raw))
    const parsed = result.data
    const explicit_fields: Partial<SettingsData> = {}

    for (const [key, value] of Object.entries(parsed)) {
      if (raw_keys.has(key)) {
        Object.assign(explicit_fields, { [key]: value })
      }
    }

    return explicit_fields
  } catch (error) {
    if (import.meta.env.DEV) console.error("Failed to load config from Hive:", error)
    return null
  }
}

/**
 * Load config from Hive blockchain for a specific user.
 * Returns full SettingsData with Zod defaults applied.
 *
 * @deprecated Use load_and_prepare_config() from config-pipeline.ts instead.
 * Kept for backwards compatibility (JSON diff preview in admin handlers).
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

    const raw: unknown = JSON.parse(jsonMatch[1])
    const result = settings_schema.safeParse(raw)

    if (!result.success) {
      if (import.meta.env.DEV) {
        console.warn('Invalid config from blockchain, using defaults:', result.error.issues)
      }
      return null
    }

    // result.data is SettingsDataParsed (Zod inferred) which structurally
    // matches SettingsData -- spread into a plain object to satisfy the return type.
    const config: SettingsData = { ...defaultSettings, ...result.data }

    // In user mode, strip community-specific fields to prevent stale data leaking
    if (!IS_COMMUNITY) {
      return strip_community_fields(config)
    }

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
