import createBeekeeper from '@hiveio/beekeeper'
import BeekeeperProvider from '@hiveio/wax-signers-beekeeper'
import { ReplyOperation } from '@hiveio/wax'
import { DataProvider, getWax } from '../../lib/blog-logic'
import type { SettingsData } from './types'

// Config post details - hardcoded parent post for all configs
const CONFIG_PARENT_AUTHOR = 'barddev'
const CONFIG_PARENT_PERMLINK = 'my-blog-configs'

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

    // Debug: Log what we're saving
    console.log('Broadcasting config to Hive:', {
      settingsKeys: Object.keys(settings),
      pageLayout: settings.pageLayout,
      authorProfileLayout2: settings.authorProfileLayout2,
      navigationTabs: settings.navigationTabs,
      authorCoverHeightPx: settings.authorCoverHeightPx,
      authorUsernameSizePx: settings.authorUsernameSizePx,
      authorDisplayNameSizePx: settings.authorDisplayNameSizePx,
      configBodyLength: configBody.length,
    })

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

    // Parse error for user-friendly message
    let errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check for RC (Resource Credits) error
    if (errorMessage.includes('not_enough_rc') || errorMessage.includes('RC mana')) {
      errorMessage = 'Not enough Resource Credits (RC). Please wait for RC to regenerate or power up more HIVE.'
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
