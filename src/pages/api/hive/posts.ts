import type { APIRoute } from 'astro'
import { getHiveBlogPosts, type HiveComment } from '../../../lib/hive'
import { getPayloadClient } from '../../../lib/payload'

interface SiteSettings {
  hiveUsername?: string
}

interface HivePostResponse {
  author: string
  permlink: string
  title: string
  body: string
  created: string
  category: string
  net_votes: number
  pending_payout_value: string
  url: string
  json_metadata: string
}

function transformPost(post: HiveComment): HivePostResponse {
  return {
    author: post.author,
    permlink: post.permlink,
    title: post.title,
    body: post.body,
    created: post.created,
    category: post.category,
    net_votes: post.net_votes,
    pending_payout_value: post.pending_payout_value,
    url: post.url,
    json_metadata: post.json_metadata,
  }
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 10

    // Get Hive username from settings
    const payload = await getPayloadClient()
    const settings = await payload.findGlobal({
      slug: 'settings',
    }) as SiteSettings

    const hiveUsername = settings.hiveUsername

    if (!hiveUsername) {
      return new Response(
        JSON.stringify({
          error: 'Hive username not configured',
          posts: [],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const posts = await getHiveBlogPosts(hiveUsername, limit)
    const transformedPosts = posts.map(transformPost)

    return new Response(
      JSON.stringify({
        username: hiveUsername,
        posts: transformedPosts,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error fetching Hive posts:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch Hive posts',
        posts: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
