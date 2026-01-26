# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Location in Projects

```
projects/hive/my-honey-pot/   <-- JESTEŚ TUTAJ
```

**Inne projekty Hive w repozytorium:**
- `../denser/` - frontend Hive (blog/wallet)
- `../honeycomb/` - biblioteka UI komponentów dla Hive

## Commands

```bash
npm run dev      # Start Astro dev server (port 4321)
npm run build    # Build for production
npm run preview  # Preview production build
```

## Architecture

This is an Astro SSR blog that fetches all data from the Hive blockchain - no database required.

### Data Sources

- **Posts**: Fetched from Hive via `bridge.get_account_posts` in `src/lib/hive.ts`
- **Config**: Stored as a comment on Hive under `@barddev/my-blog-configs`, loaded via `loadConfigFromHive()` in `src/components/admin/hive-broadcast.ts`
- **Auth**: Client-side HB-Auth login (posting/active key), no server sessions

### Key Files

- `src/lib/hive.ts` - Hive blockchain data fetching (posts, profiles)
- `src/lib/blog-logic/wax.ts` - Wax chain instance management with endpoint fallback
- `src/components/admin/hive-broadcast.ts` - Config save/load to Hive blockchain
- `src/components/admin/queries.ts` - TanStack Query + SolidJS store for settings
- `src/components/admin/types.ts` - All settings types and defaults

### Routes

- `/` - Homepage with posts grid (SSR, loads config from Hive)
- `/posts/[permlink]` - Individual post page (SSR)
- `/admin` - Admin panel (client:only SolidJS, requires HB-Auth login)

### Config Storage Pattern

Config is saved as a Hive comment with JSON in markdown code block:
```
# Blog Configuration for @username
```json
{ ...settings }
```
```

The comment is created/updated under `@barddev/my-blog-configs` post.

## Tech Stack

- Astro 5 (SSR with `@astrojs/node`)
- SolidJS (interactive components via `@astrojs/solid-js`)
- TanStack Query (`@tanstack/solid-query` for data fetching)
- Tailwind CSS 4 (`@tailwindcss/vite`)
- @hiveio/wax, @hiveio/beekeeper, @hiveio/hb-auth (Hive blockchain)

## Code Style

### TypeScript
- Strict typing, avoid `any`
- Avoid type assertions (`as Type`) - use type guards
- Define interfaces in `types.ts` files

### Tailwind CSS
- Use CSS variables from theme: `bg-primary`, `text-muted`, `border-border`
- Avoid hardcoded colors: `bg-red-500`, `text-blue-600`
- Custom colors defined in `src/styles/global.css` with `@theme`

### Components

**Astro (`.astro`)** - Static/SSR content, props via `Astro.props`

**SolidJS (`.tsx`)** - Interactive UI, use `createSignal`/`createStore`
- Use `client:only="solid-js"` for components that need browser APIs
- Use `client:load` for hydrating SSR content

### State Management

Admin uses centralized SolidJS store in `src/components/admin/queries.ts`:
```typescript
import { settings, updateSettings } from './queries'
// Read: settings.siteTitle
// Write: updateSettings({ siteTitle: 'New Title' })
```

## Hive Integration

### API Endpoints (with fallback)
Wax client rotates through endpoints on timeout: `api.hive.blog`, `api.deathwing.me`, `hive-api.arcange.eu`

### Image Proxy
Always use Hive image proxy for external images:
```typescript
`https://images.hive.blog/256x512/${imageUrl}`
```

### Resource Credits
Saving config costs RC. Show warning before save, handle `not_enough_rc` errors gracefully.
