import type { APIRoute } from 'astro'
import { getPayloadClient } from '../../../../lib/payload'

export const GET: APIRoute = async () => {
  try {
    const payload = await getPayloadClient()

    const posts = await payload.find({
      collection: 'posts',
      sort: '-createdAt',
    })

    return new Response(JSON.stringify(posts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch posts' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await getPayloadClient()
    const body = await request.json()
    const { title, slug, content, excerpt, status, publishedDate } = body

    const post = await payload.create({
      collection: 'posts',
      data: {
        title,
        slug,
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', text: content }],
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        excerpt,
        status,
        publishedDate,
      },
    })

    return new Response(JSON.stringify(post), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error creating post:', error)
    return new Response(JSON.stringify({ error: 'Failed to create post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
