import 'dotenv/config'
import express from 'express'
import type { Request, Response } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { getPayload } from 'payload'
import config from './src/payload/payload.config'

const app = express()
const PORT = 4321
const ASTRO_DEV_PORT = 4322

const start = async () => {
  // Initialize Payload
  console.log('Initializing Payload CMS...')
  const payload = await getPayload({ config })
  console.log('Payload CMS initialized!')

  // Parse JSON
  app.use(express.json())

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
      console.error('Error fetching posts:', error)
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
      console.error('Error fetching post:', error)
      res.status(500).json({ error: 'Failed to fetch post' })
    }
  })

  // Admin panel - simple data management UI
  app.get('/admin', (req: Request, res: Response) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="utf-8">
        <title>Admin Panel - Astro + Payload</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: system-ui, sans-serif; padding: 2rem; background: #1a1a2e; color: #eee; }
          h1 { margin-bottom: 2rem; }
          .container { max-width: 1000px; margin: 0 auto; }
          .card { background: #16213e; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; }
          .card h2 { color: #e94560; margin-bottom: 1rem; }
          form { display: flex; flex-direction: column; gap: 1rem; }
          label { font-weight: bold; }
          input, textarea, select { padding: 0.5rem; border: 1px solid #333; border-radius: 4px; background: #0f0f23; color: #fff; }
          textarea { min-height: 150px; }
          button { padding: 0.75rem 1.5rem; background: #e94560; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
          button:hover { background: #d63850; }
          .posts-list { margin-top: 2rem; }
          .post-item { background: #0f3460; padding: 1rem; border-radius: 4px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; }
          .post-title { font-weight: bold; }
          .post-status { font-size: 0.8rem; padding: 0.25rem 0.5rem; border-radius: 4px; }
          .post-status.published { background: #4caf50; }
          .post-status.draft { background: #ff9800; }
          .btn-delete { background: #f44336; padding: 0.5rem 1rem; font-size: 0.875rem; }
          .message { padding: 1rem; border-radius: 4px; margin-bottom: 1rem; }
          .message.success { background: #4caf50; }
          .message.error { background: #f44336; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Admin Panel</h1>

          <div id="message"></div>

          <div class="card">
            <h2>Dodaj nowy post</h2>
            <form id="postForm">
              <label>Tytuł</label>
              <input type="text" name="title" required>

              <label>Slug (URL)</label>
              <input type="text" name="slug" required placeholder="moj-pierwszy-post">

              <label>Treść</label>
              <textarea name="content" required placeholder="Treść posta..."></textarea>

              <label>Zajawka</label>
              <textarea name="excerpt" rows="2" placeholder="Krótki opis..."></textarea>

              <label>Status</label>
              <select name="status">
                <option value="draft">Szkic</option>
                <option value="published">Opublikowany</option>
              </select>

              <button type="submit">Dodaj post</button>
            </form>
          </div>

          <div class="card posts-list">
            <h2>Lista postów</h2>
            <div id="posts">Ładowanie...</div>
          </div>
        </div>

        <script>
          async function loadPosts() {
            try {
              const res = await fetch('/api/admin/posts');
              const data = await res.json();
              const postsDiv = document.getElementById('posts');

              if (data.docs.length === 0) {
                postsDiv.innerHTML = '<p>Brak postów</p>';
                return;
              }

              postsDiv.innerHTML = data.docs.map(post => \`
                <div class="post-item">
                  <div>
                    <span class="post-title">\${post.title}</span>
                    <span class="post-status \${post.status}">\${post.status}</span>
                  </div>
                  <button class="btn-delete" onclick="deletePost('\${post.id}')">Usuń</button>
                </div>
              \`).join('');
            } catch (e) {
              document.getElementById('posts').innerHTML = '<p>Błąd ładowania postów</p>';
            }
          }

          document.getElementById('postForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const data = {
              title: form.title.value,
              slug: form.slug.value,
              content: form.content.value,
              excerpt: form.excerpt.value,
              status: form.status.value,
              publishedDate: new Date().toISOString()
            };

            try {
              const res = await fetch('/api/admin/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });

              if (res.ok) {
                showMessage('Post dodany!', 'success');
                form.reset();
                loadPosts();
              } else {
                showMessage('Błąd dodawania posta', 'error');
              }
            } catch (e) {
              showMessage('Błąd połączenia', 'error');
            }
          });

          async function deletePost(id) {
            if (!confirm('Czy na pewno chcesz usunąć ten post?')) return;

            try {
              const res = await fetch('/api/admin/posts/' + id, { method: 'DELETE' });
              if (res.ok) {
                showMessage('Post usunięty!', 'success');
                loadPosts();
              } else {
                showMessage('Błąd usuwania', 'error');
              }
            } catch (e) {
              showMessage('Błąd połączenia', 'error');
            }
          }

          function showMessage(text, type) {
            const msg = document.getElementById('message');
            msg.className = 'message ' + type;
            msg.textContent = text;
            setTimeout(() => msg.className = '', 3000);
          }

          loadPosts();
        </script>
      </body>
      </html>
    `)
  })

  // Admin API endpoints
  app.get('/api/admin/posts', async (req: Request, res: Response) => {
    try {
      const posts = await payload.find({
        collection: 'posts',
        sort: '-createdAt',
      })
      res.json(posts)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch posts' })
    }
  })

  app.post('/api/admin/posts', async (req: Request, res: Response) => {
    try {
      const { title, slug, content, excerpt, status, publishedDate } = req.body

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
                  children: [{ type: 'text', text: content }]
                }
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1
            }
          },
          excerpt,
          status,
          publishedDate
        }
      })

      res.json(post)
    } catch (error) {
      console.error('Error creating post:', error)
      res.status(500).json({ error: 'Failed to create post' })
    }
  })

  app.delete('/api/admin/posts/:id', async (req: Request, res: Response) => {
    try {
      await payload.delete({
        collection: 'posts',
        id: req.params.id
      })
      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete post' })
    }
  })

  // Proxy all other requests to Astro dev server
  app.use(
    createProxyMiddleware({
      target: `http://localhost:${ASTRO_DEV_PORT}`,
      changeOrigin: true,
      ws: true, // WebSocket support for HMR
    })
  )

  app.listen(PORT, () => {
    console.log('')
    console.log('========================================')
    console.log(`  Serwer uruchomiony na http://localhost:${PORT}`)
    console.log('========================================')
    console.log(`  Strona:      http://localhost:${PORT}`)
    console.log(`  Admin:       http://localhost:${PORT}/admin`)
    console.log(`  API:         http://localhost:${PORT}/api/posts`)
    console.log('========================================')
    console.log('')
  })
}

start()
