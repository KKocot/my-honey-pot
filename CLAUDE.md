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
- SolidJS (via `@astrojs/solid-js` for interactive components)
- Payload CMS 3 (headless, MongoDB via `@payloadcms/db-mongodb`)
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- @hiveio/wax (Hive blockchain API client)
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

## Component Architecture

### SolidJS Integration

This project uses SolidJS for interactive components within Astro. SolidJS components use the `.tsx` extension.

```typescript
// Use client:load directive for interactive components
<AdminPanel client:load />
```

### Directory Structure

```
src/components/
├── ui/                 # Reusable UI components (SolidJS)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Checkbox.tsx
│   ├── Slider.tsx
│   ├── Toast.tsx
│   ├── Card.tsx
│   └── index.ts        # Barrel export
├── admin/              # Admin panel components (SolidJS)
│   ├── types.ts        # Shared types
│   ├── store.ts        # State management
│   ├── AdminPanel.tsx  # Main entry component
│   ├── LayoutEditor.tsx
│   ├── SiteSettings.tsx
│   ├── PostsLayoutSettings.tsx
│   ├── CardAppearanceSettings.tsx
│   └── index.ts
└── home/               # Homepage components (Astro)
    ├── types.ts
    ├── Header.astro
    ├── AuthorProfile.astro
    ├── PostCard.astro
    ├── PostsGrid.astro
    ├── Footer.astro
    └── index.ts
```

### Component Guidelines

**Astro Components (`.astro`)**
- Use for static/SSR content
- Accept props via `Astro.props`
- No client-side JavaScript unless necessary

**SolidJS Components (`.tsx`)**
- Use for interactive/reactive UI
- Use `createSignal` for local state
- Use `createStore` from `solid-js/store` for complex state
- Export components as named exports

### State Management

Admin panel uses a centralized store pattern:

```typescript
// src/components/admin/store.ts
import { createStore, produce } from 'solid-js/store'

const [settings, setSettings] = createStore(defaultSettings)

export function updateSettings(partial: Partial<SettingsData>) {
  setSettings(produce((s) => Object.assign(s, partial)))
}
```

## Clean Code Principles

### Single Responsibility
- Each component should have one clear purpose
- Break large components into smaller, focused ones
- Keep files under ~200 lines when possible

### DRY (Don't Repeat Yourself)
- Extract shared logic into utility functions
- Use shared type definitions in `types.ts` files
- Create reusable UI components for common patterns

### Naming Conventions
- Components: PascalCase (`PostCard.tsx`, `AuthorProfile.astro`)
- Functions: camelCase (`getHiveBlogPosts`, `parsePostMetadata`)
- Types/Interfaces: PascalCase (`BridgePost`, `SiteSettings`)
- Constants: UPPER_SNAKE_CASE for truly constant values, camelCase for config

### File Organization
- Group related components in directories
- Use barrel exports (`index.ts`) for clean imports
- Keep types close to where they're used
- Separate concerns: types, store, components

### Props Design
- Use explicit interfaces for component props
- Provide sensible defaults
- Document complex props with JSDoc when needed

```typescript
interface Props {
  /** Username to display */
  username: string
  /** Avatar size in pixels */
  avatarSize?: number
}

const { username, avatarSize = 64 } = Astro.props
```

## Hive Blockchain Integration

### Bridge API
- Use `bridge.get_account_posts` for user blog posts
- Use `bridge.get_profile` for user profile info
- `json_metadata` from bridge API is already parsed (object, not string)

### Image Handling
- Always validate image URLs (must start with `http://` or `https://`)
- Use Hive image proxy: `https://images.hive.blog/256x512/{url}`
- Filter out invalid image references (e.g., `youtu-xxxx`)

```typescript
function getThumbnailUrl(imageUrl: string | undefined): string | null {
  if (!imageUrl || !imageUrl.startsWith('http')) return null
  return `https://images.hive.blog/256x512/${imageUrl}`
}
```
