import createBeekeeper from '@hiveio/beekeeper'
import BeekeeperProvider from '@hiveio/wax-signers-beekeeper'
import { ReplyOperation } from '@hiveio/wax'
import { getWax, resetWax } from '../../lib/blog-logic/wax'
import type { SettingsData } from './types'

// Config post details - hardcoded parent post for all configs
const CONFIG_PARENT_AUTHOR = 'barddev'
const CONFIG_PARENT_PERMLINK = 'my-blog-configs'

const MAX_RETRIES = 3

/**
 * Helper to retry API calls with endpoint switching on timeout
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Reset and get fresh chain for each attempt
      if (attempt > 0) {
        resetWax()
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      const isTimeout = lastError.message.toLowerCase().includes('timeout')

      if (isTimeout && attempt < MAX_RETRIES - 1) {
        console.warn(`Config API request timed out (attempt ${attempt + 1}/${MAX_RETRIES}), switching endpoint...`)
        // Continue to next attempt - resetWax will be called at start of next iteration
      } else if (!isTimeout) {
        throw lastError
      }
    }
  }

  throw lastError || new Error('All retry attempts failed')
}

/**
 * Find existing config comment from a user under the config post
 * Returns the permlink if found, null otherwise
 */
async function findExistingConfig(username: string): Promise<{ permlink: string; body: string } | null> {
  try {
    const discussion = await withRetry(async () => {
      const chain = await getWax()
      return chain.api.bridge.get_discussion({
        author: CONFIG_PARENT_AUTHOR,
        permlink: CONFIG_PARENT_PERMLINK,
        observer: ''
      })
    })

    if (!discussion) {
      return null
    }

    // Search through all comments to find one from this user with config
    for (const key of Object.keys(discussion)) {
      const comment = discussion[key]

      // Skip the parent post itself
      if (comment.author === CONFIG_PARENT_AUTHOR && comment.permlink === CONFIG_PARENT_PERMLINK) {
        continue
      }

      // Check if this comment is from our user and is a config comment
      if (comment.author === username && comment.parent_author === CONFIG_PARENT_AUTHOR && comment.parent_permlink === CONFIG_PARENT_PERMLINK) {
        // Check if it contains a JSON config block
        if (comment.body.includes('```json')) {
          return {
            permlink: comment.permlink,
            body: comment.body
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error finding existing config:', error)
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
 * Broadcast settings as a comment to Hive blockchain
 * If config already exists from this user, it will be updated. Otherwise, a new one is created.
 */
export async function broadcastConfigToHive(
  settings: SettingsData,
  username: string,
  privateKey: string
): Promise<{ success: boolean; txId?: string; permlink?: string; isUpdate?: boolean; error?: string }> {
  try {
    const chain = await getWax()

    // Check if user already has a config comment under this post
    const existingConfig = await findExistingConfig(username)
    const isUpdate = !!existingConfig

    // Use existing permlink for update, or generate new one for create
    const permlink = existingConfig ? existingConfig.permlink : generateNewConfigPermlink(username)

    // Create beekeeper instance (in-memory mode for browser)
    const beekeeper = await createBeekeeper({ inMemory: true })

    // Create session and wallet
    const session = beekeeper.createSession('config-session')
    const { wallet } = await session.createWallet('temp-wallet')

    // Import the private key
    const publicKey = await wallet.importKey(privateKey)

    // Create provider for signing
    const provider = BeekeeperProvider.for(chain, wallet, publicKey)

    // Create transaction
    const tx = await chain.createTransaction()

    // Prepare config body
    const configBody = JSON.stringify(settings, null, 2)
    const timestamp = new Date().toISOString()

    // Add reply operation - same operation for create and update
    // In Hive, posting a comment with the same author+permlink updates it
    tx.pushOperation(new ReplyOperation({
      parentAuthor: CONFIG_PARENT_AUTHOR,
      parentPermlink: CONFIG_PARENT_PERMLINK,
      author: username,
      body: `# Blog Configuration for @${username}\n\nLast updated: ${timestamp}\n\n\`\`\`json\n${configBody}\n\`\`\``,
      permlink: permlink,
      jsonMetadata: {
        app: 'hive-blog-config/1.0',
        format: 'markdown',
        tags: ['hive-blog-config'],
        config_version: '1.0',
        updated_at: timestamp,
      }
    }))

    // Sign the transaction
    await provider.signTransaction(tx)

    // Broadcast
    await chain.broadcast(tx)

    // Cleanup
    session.close()
    beekeeper.delete()

    return {
      success: true,
      txId: tx.id,
      permlink: permlink,
      isUpdate: isUpdate
    }
  } catch (error) {
    console.error('Failed to broadcast config:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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
    console.error('Failed to load config from Hive:', error)
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
