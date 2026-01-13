import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { getPayload } from 'payload'
import config from './payload.config'

const app = express()
const PORT = process.env.PAYLOAD_PORT || 3000

// Middleware
app.use(cors({
  origin: ['http://localhost:4321', 'http://localhost:3000'],
  credentials: true,
}))

const start = async () => {
  const payload = await getPayload({ config })

  // REST API endpoints
  app.get('/api/posts', async (req, res) => {
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

  app.get('/api/posts/:slug', async (req, res) => {
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
        return res.status(404).json({ error: 'Post not found' })
      }

      res.json(posts.docs[0])
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch post' })
    }
  })

  app.listen(PORT, () => {
    console.log(`Payload CMS is running on http://localhost:${PORT}`)
    console.log(`Admin panel: http://localhost:${PORT}/admin`)
    console.log(`API: http://localhost:${PORT}/api`)
  })
}

start()
