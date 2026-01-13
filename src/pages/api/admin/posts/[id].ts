import type { APIRoute } from 'astro'
import { getPayloadClient } from '../../../../lib/payload'

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const payload = await getPayloadClient()
    const { id } = params

    await payload.delete({
      collection: 'posts',
      id: id!,
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error deleting post:', error)
    return new Response(JSON.stringify({ error: 'Failed to delete post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
