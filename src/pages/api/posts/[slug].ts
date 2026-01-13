import type { APIRoute } from 'astro'
import { getPayloadClient } from '../../../lib/payload'

export const GET: APIRoute = async ({ params }) => {
  try {
    const payload = await getPayloadClient()
    const { slug } = params

    const posts = await payload.find({
      collection: 'posts',
      where: {
        slug: {
          equals: slug,
        },
      },
      limit: 1,
    })

    if (posts.docs.length === 0) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(posts.docs[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
