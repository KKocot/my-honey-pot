import type { APIRoute } from 'astro'
import { getHivePost } from '../../../../../lib/hive'

export const GET: APIRoute = async ({ params }) => {
  try {
    const { author, permlink } = params

    if (!author || !permlink) {
      return new Response(
        JSON.stringify({ error: 'Author and permlink are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const post = await getHivePost(author, permlink)

    if (!post || !post.author) {
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        author: post.author,
        permlink: post.permlink,
        title: post.title,
        body: post.body,
        created: post.created,
        last_update: post.last_update,
        category: post.category,
        net_votes: post.net_votes,
        children: post.children,
        pending_payout_value: post.pending_payout_value,
        total_payout_value: post.total_payout_value,
        curator_payout_value: post.curator_payout_value,
        url: post.url,
        json_metadata: post.json_metadata,
        active_votes: post.active_votes,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error fetching Hive post:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch Hive post' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
