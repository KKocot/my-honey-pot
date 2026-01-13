# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Astro dev server (port 4321)
npm run build    # Build for production
npm run preview  # Preview production build
```

**Requires MongoDB running** (e.g., `docker run -d -p 27017:27017 mongo:latest`)

## Architecture

This is an Astro SSR application with Payload CMS integrated directly (no separate CMS server).

### Key Integration Pattern

Payload CMS runs inside Astro's Node.js process. The singleton pattern in `src/lib/payload.ts` provides database access:

```typescript
import { getPayloadClient } from '../lib/payload'
const payload = await getPayloadClient()
const posts = await payload.find({ collection: 'posts' })
```

### Data Flow

1. **Astro pages** (`src/pages/*.astro`) - Call `getPayloadClient()` directly in frontmatter for SSR
2. **API routes** (`src/pages/api/**/*.ts`) - Expose REST endpoints using Astro's `APIRoute` pattern
3. **Payload collections** (`src/payload/collections/`) - Define data schemas with Payload's `CollectionConfig`

### Routes

- `/` - Public posts list (SSR)
- `/posts/[slug]` - Individual post (SSR)
- `/admin` - Custom admin panel (Astro page, not Payload's built-in admin)
- `/api/posts` - Public API (GET published posts)
- `/api/admin/posts` - Admin API (GET all, POST create)
- `/api/admin/posts/[id]` - Admin API (DELETE)

### Rich Text

Posts use Lexical editor. Content stored as JSON tree structure. Rendered via `renderLexicalContent()` helper in post pages.

## Tech Stack

- Astro 5 (SSR mode with `@astrojs/node` adapter)
- Payload CMS 3 (headless, MongoDB via `@payloadcms/db-mongodb`)
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- TypeScript (strict mode)

## Code Style Rules

### TypeScript

- Use strict typing - avoid `any` type
- Avoid type assertions (`as Type`) - use proper type guards or generics instead
- Define explicit interfaces for data structures
- Use proper return types for functions

### Tailwind CSS

- Use CSS variables defined in theme, not hardcoded color classes
- Prefer: `bg-primary`, `text-accent`, `border-muted`
- Avoid: `bg-red-500`, `text-blue-600`, `border-gray-300`
- Define custom colors in `src/styles/global.css` using `@theme` directive
