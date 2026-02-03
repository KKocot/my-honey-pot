# My Honey Pot

A configurable, database-free blog platform powered by the Hive blockchain. All content, configuration, and data are stored and retrieved directly from Hive - no traditional database required. Built with Astro 5 SSR and SolidJS for a fast, modern user experience.

## Features

- **Blockchain-first architecture** - All posts fetched from Hive blockchain via `bridge.get_account_posts`
- **Database-free** - No MongoDB, PostgreSQL, or any traditional database needed
- **Configurable admin panel** - Customize site title, description, layouts, colors, and more via `/admin`
- **Configuration stored on Hive** - Settings saved as blockchain comments under `@barddev/my-blog-configs`
- **SSR for performance** - Server-side rendered pages with Astro for optimal SEO and speed
- **HB-Auth integration** - Secure client-side authentication using Hive posting/active keys
- **Automatic endpoint fallback** - Wax client rotates through multiple Hive API endpoints on timeout
- **Responsive design** - Tailwind CSS 4 with custom theming and dark mode support
- **Multiple layout options** - Grid, list, or minimal post layouts
- **Markdown support** - Full markdown rendering with sanitization and embed support (YouTube, Vimeo, 3Speak)

## Requirements

- Node.js 18 or higher
- npm 8 or higher
- A Hive blockchain account (for posting and configuration)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
# Edit .env and set HIVE_USERNAME=your-hive-username
```

3. Start development server:

```bash
npm run dev
```

Visit `http://localhost:4326` to see your blog. Access admin panel at `http://localhost:4326/admin`.

**Note**: Development server runs on port 4326 (configured in `package.json`), while production Docker deployment uses port 4321 (see Deployment VPS section).

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HIVE_USERNAME` | Yes | - | Hive username whose posts will be displayed on the blog |
| `HIVE_API_ENDPOINT` | No | `https://api.openhive.network` | Custom Hive API endpoint for data fetching |
| `CONFIG_PARENT_AUTHOR` | No | `barddev` | Hive account where config comments are stored |
| `CONFIG_PARENT_PERMLINK` | No | `my-blog-configs` | Permlink of the post under which config is saved |
| `PUBLIC_SITE_URL` | No | - | Site URL for canonical links and SEO (used by Astro) |
| `TEST_HIVE_USERNAME` | No | - | Hive username for Playwright E2E tests |
| `TEST_HIVE_PASSWORD` | No | - | Password for test account (E2E only) |
| `TEST_HIVE_WIF` | No | - | Private key for test account (E2E only) |

## Deployment VPS (Docker)

### Requirements

- Docker and Docker Compose installed on VPS
- Traefik reverse proxy configured with TLS
- External Docker network `common_proxy_network` created

### Steps

1. Clone repository on VPS:

```bash
git clone https://github.com/KKocot/my-honey-pot.git
cd my-honey-pot
```

2. Create production `.env` file:

```bash
# .env
HIVE_USERNAME=your-hive-username
DOMAIN=yourdomain.com
PUBLIC_SITE_URL=https://yourdomain.com
```

3. Build and start container:

```bash
docker compose build
docker compose up -d
```

4. Verify deployment:

```bash
docker logs -f my-honey-pot
```

The application will be available at `https://yourdomain.com` via Traefik.

### Docker Compose Configuration

The `compose.yml` includes:
- Multi-stage build (Node.js 24 Alpine)
- Non-root user for security
- Traefik labels for automatic HTTPS
- External network for reverse proxy communication
- Exposed port 4321 (internal Docker network only; Traefik proxies external HTTPS traffic)

## Deployment Vercel

### Automatic Adapter Detection

The project automatically detects Vercel deployment via `VERCEL=1` environment variable and switches from `@astrojs/node` to `@astrojs/vercel` adapter.

### Steps

1. Push repository to GitHub

2. Import project to Vercel dashboard

3. Set environment variables in Vercel:

```
HIVE_USERNAME=your-hive-username
PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

4. Deploy

### Configuration

**Note**: `vercel.json` is optional for Astro + Vercel deployments. The `@astrojs/vercel` adapter handles most configuration automatically.

Vercel-specific settings in `vercel.json`:
- Node.js 22 runtime (`nodejs22.x`) for serverless functions
- Frankfurt region (`fra1`) for EU deployments
- All `.mjs` functions handled by `@vercel/node`

### Limitations

- Serverless functions have cold start latency (first request may be slower)
- Function execution time limited to 10s (Hobby) or 60s (Pro) for Vercel Serverless Functions
- Hive API requests may timeout on cold starts - endpoint fallback handles this

## Architecture

### Data Flow

```
User Request
    ↓
Astro SSR (Node.js)
    ↓
Hive Blockchain API
    ↓
Posts + Metadata
    ↓
Rendered HTML Response
```

### Configuration Storage

Configuration is stored as a Hive blockchain comment with JSON in markdown code block:

```
# Blog Configuration for @username
```json
{
  "siteTitle": "My Blog",
  "siteDescription": "Welcome to my blog",
  ...
}
```
```

The comment is created/updated under `@barddev/my-blog-configs` post. This ensures:
- Configuration is immutable and version-controlled on blockchain
- No database sync issues or server state
- Transparent and auditable changes

### Hive API Endpoints

Wax client automatically rotates through multiple endpoints on timeout:
1. `api.openhive.network` (default)
2. `api.hive.blog`
3. `api.deathwing.me`
4. `hive-api.arcange.eu`

This ensures high availability even if one endpoint is down.

## Admin Panel

Access the admin panel at `/admin` to configure your blog.

### Authentication

1. Click "Login with Hive" button
2. HB-Auth popup opens (client-side authentication)
3. Enter your Hive username and posting/active key
4. Keys are stored in browser session only (never sent to server)

### Configurable Settings

- **Site Information**: Title, description, author name
- **Layout**: Grid, list, or minimal post layout
- **Colors**: Primary, secondary, accent colors with live preview
- **Visibility**: Show/hide author profile, comments, post metadata
- **Content**: Posts per page, featured posts, pinned content
- **SEO**: Meta tags, Open Graph settings, canonical URLs

### Saving Configuration

1. Make changes in admin panel
2. Click "Save to Hive Blockchain"
3. Sign transaction with HB-Auth popup
4. Configuration saved as comment on Hive (costs Resource Credits)
5. Changes visible immediately on next page load

### Resource Credits

Saving configuration to Hive costs Resource Credits (RC). Ensure your account has sufficient RC before saving. The app shows a warning if RC might be insufficient.

## Project Structure

```
my-honey-pot/
├── src/
│   ├── components/          # Astro and SolidJS components
│   │   ├── admin/           # Admin panel (SolidJS + TanStack Query)
│   │   ├── auth/            # HB-Auth integration
│   │   ├── home/            # Homepage components
│   │   └── ui/              # Reusable UI components
│   ├── shared/              # Shared utilities and components
│   │   ├── components/      # Navigation, footer, post cards
│   │   ├── formatters/      # Date, markdown, content helpers
│   │   └── icons/           # SVG icons
│   ├── lib/                 # Core logic
│   │   ├── hive.ts          # Hive API client (posts, profiles)
│   │   └── blog-logic/      # Wax chain instance, config management
│   ├── pages/               # Astro routes
│   │   ├── index.astro      # Homepage (SSR)
│   │   ├── posts/[permlink].astro  # Post page (SSR)
│   │   └── admin.astro      # Admin panel (client:only)
│   └── styles/              # Global CSS and Tailwind theme
├── public/                  # Static assets
│   └── auth/                # HB-Auth assets (copied from node_modules)
├── tests/                   # Playwright E2E tests
├── astro.config.mjs         # Astro configuration
├── compose.yml              # Docker Compose for VPS
├── Dockerfile               # Multi-stage Docker build
├── vercel.json              # Vercel deployment config
└── .env.example             # Example environment variables
```

### Key Files

- `src/lib/hive.ts` - Hive blockchain data fetching (posts, profiles)
- `src/lib/blog-logic/wax.ts` - Wax chain instance with endpoint fallback
- `src/components/admin/hive-broadcast.ts` - Config save/load to Hive blockchain
- `src/components/admin/queries.ts` - TanStack Query + SolidJS store for settings
- `src/components/admin/types.ts` - All settings types and defaults

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Astro | ^5.16.15 | SSR framework |
| SolidJS | ^1.9.11 | Interactive components |
| @astrojs/node | ^9.5.1 | Node.js adapter (VPS) |
| @astrojs/vercel | ^9.0.4 | Vercel adapter (serverless) |
| @hiveio/wax | ^1.28.4-rc0 | Hive blockchain API |
| @hiveio/beekeeper | ^1.28.4 | Key management |
| @hiveio/hb-auth | ^1.28.4-rc0 | Hive authentication |
| @tanstack/solid-query | ^5.90.20 | Server state management |
| Tailwind CSS | ^4.1.18 | Styling framework |
| TypeScript | ^5.9 | Type safety |
| Playwright | ^1.58.0 | E2E testing |

## Testing

The project includes Playwright E2E tests for critical user flows and Hive integration.

### Setup

Add test account credentials to `.env`:

```bash
TEST_HIVE_USERNAME=your-test-account
TEST_HIVE_PASSWORD=your-password
TEST_HIVE_WIF=your-private-key
```

**Important**: Use a dedicated test account with minimal funds/RC. Never use your main Hive account for testing.

### Running Tests

| Command | Description |
|---------|-------------|
| `npm run test` | Run all Playwright tests in headless mode |
| `npm run test:ui` | Run tests with Playwright UI mode (interactive) |

### What is Tested

E2E tests cover:
- Homepage rendering and post list fetching from Hive blockchain
- Admin panel authentication via HB-Auth (mock mode)
- Configuration save/load to Hive blockchain
- Post page rendering with markdown and embeds
- Error handling for network timeouts and API failures

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Astro dev server (port 4326) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run Playwright E2E tests |
| `npm run test:ui` | Run Playwright tests with UI mode |
| `npm run astro` | Run Astro CLI commands |

---

Built with Hive blockchain technology - decentralized, transparent, and censorship-resistant.
