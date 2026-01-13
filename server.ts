import 'dotenv/config'
import express, { Request, Response } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { getPayload } from 'payload'
import config from './src/payload/payload.config'
import { handler as astroHandler } from './dist/server/entry.mjs'

const app = express()
const PORT = process.env.PORT || 4321

const start = async () => {
  // Initialize Payload
  const payload = await getPayload({ config })

  // API endpoints
  app.get('/api/posts', async (req: Request, res: Response) => {
    try {
      const posts = await payload.find({
        collection: 'posts',
        where: {
          status: {
            equals: 'published',
          },
        },
        sort: '-publishedDate',
      })
      res.json(posts)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch posts' })
    }
  })

  app.get('/api/posts/:slug', async (req: Request, res: Response) => {
    try {
      const posts = await payload.find({
        collection: 'posts',
        where: {
          slug: {
            equals: req.params.slug,
          },
        },
        limit: 1,
      })

      if (posts.docs.length === 0) {
        res.status(404).json({ error: 'Post not found' })
        return
      }

      res.json(posts.docs[0])
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch post' })
    }
  })

  // Payload Admin panel routes - proxy to Payload's built-in admin
  // Note: Payload 3.x requires Next.js for the admin panel
  // For a simpler setup, we'll serve Astro and API from same port

  // Handle Astro routes
  app.use(astroHandler)

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`API: http://localhost:${PORT}/api/posts`)
  })
}

start()
