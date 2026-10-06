# My Honey Pot

A blog platform powered by Hive blockchain. All your content is stored on the blockchain - no traditional database needed.

**Demo**: [https://myhoneypot.bard-dev.com](https://myhoneypot.bard-dev.com)

Visit the demo site to learn more about the project, see it in action, and explore all features.

## What is this?

My Honey Pot is a blog platform that uses Hive blockchain to store and retrieve all content. Instead of saving posts in a traditional database, everything is fetched directly from the blockchain. This makes your blog:

- Decentralized - your content lives on the blockchain
- Censorship-resistant - no central authority controls your data
- Transparent - all changes are publicly recorded
- Database-free - no need to manage servers or databases

## Features

- All posts fetched directly from Hive blockchain
- Customizable design through admin panel
- No database setup required
- Secure authentication with Hive keys
- Responsive design with dark mode

## Requirements

### For all deployments:

- A Hive blockchain account - create one at [hive.io](https://hive.io) or [ecency.com](https://ecency.com)
- Your Hive username - the blog will display posts from this account

### Additional for VPS/Docker deployments:

- A VPS (Virtual Private Server) with Docker installed
- Traefik reverse proxy running with `common_proxy_network` network configured
- A domain name pointed to your VPS

## Quick Deployment on Vercel (Recommended)

Vercel is the easiest way to deploy this blog. It's free for personal projects.

### Step 1: Prepare the code

1. Create a GitHub account if you don't have one
2. Fork or clone this repository to your GitHub account

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account
2. Click "New Project"
3. Import your forked repository
4. Add environment variables:
   - `HIVE_USERNAME` = your Hive username (without @)
   - `PUBLIC_SITE_URL` = leave empty for first deploy, you will add your Vercel URL after deployment
5. Click "Deploy"

### Step 3: Configure site URL

After deployment completes:

1. Copy your Vercel URL (e.g., `your-project.vercel.app`)
2. Go to Project Settings > Environment Variables
3. Update `PUBLIC_SITE_URL` to `https://your-project.vercel.app`
4. Redeploy (Deployments tab > three dots > Redeploy)

### Step 4: Done

Your blog is now live. Vercel will give you a URL like `your-project.vercel.app`.

You can add a custom domain later in Vercel dashboard settings.

## Advanced Deployment on VPS (Docker)

If you have your own server and want full control, you can deploy with Docker.

**IMPORTANT**: This project REQUIRES Traefik reverse proxy with `common_proxy_network` external network. The container will not start without it.

### Steps

1. Connect to your VPS via SSH

2. Clone this repository:

```bash
git clone https://github.com/KKocot/my-honey-pot.git
cd my-honey-pot
```

3. Create a `.env` file with your settings:

```bash
HIVE_USERNAME=your-hive-username
DOMAIN=yourdomain.com
PUBLIC_SITE_URL=https://yourdomain.com
```

4. Verify Traefik is running:

```bash
docker network ls | grep common_proxy_network
```

If the network doesn't exist, set up Traefik first before continuing.

5. Build and start the container:

```bash
docker compose up -d --build
```

6. Check if it's running:

```bash
docker logs -f my-honey-pot
```

Your blog will be available at your domain via HTTPS through Traefik.

## Running via hive-blog-service

[hive-blog-service](https://github.com/KKocot/hive-blog-service) starts one container per blog from a prebuilt image. This section is for the operator of that service.

### Build and tag the image

The service expects the image `my-honey-pot:latest` on the Docker host:

```bash
docker build -t my-honey-pot:latest .
# or
docker compose build
```

Build-time variables (`PUBLIC_HIVE_API_ENDPOINT`, `PUBLIC_HIVE_CHAIN_ID`, `PUBLIC_HIVE_IMAGES_ENDPOINT`, `PUBLIC_HIVE_BLOG_URL`, `PUBLIC_HIVE_SIGNER_URL`) are inlined into the bundle, so they apply to every blog created from the image. Changing them means rebuilding the image. Defaults target Hive mainnet.

### Runtime environment

Set per container by the service:

| Variable | Required | Description |
| --- | --- | --- |
| `HIVE_USERNAME` | yes | Blog owner account (personal blogs only) |
| `PUBLIC_SITE_URL` | yes | Public URL of the blog, e.g. `https://alice.blogs.example` |
| `HOST` | no | Defaults to `0.0.0.0` in the image |
| `PORT` | no | Defaults to `4321` in the image |
| `NODE_ENV` | no | Defaults to `production` in the image |
| `CONFIG_PARENT_AUTHOR`, `CONFIG_PARENT_PERMLINK` | no | Where blog configs are stored on Hive (default `barddev/my-blog-configs`) |

### Health check

`GET /healthz` returns `200 {"status":"ok"}` without contacting Hive, so a slow or unavailable Hive node does not mark the container unhealthy. The image has a built-in `HEALTHCHECK` against this endpoint (`docker inspect --format '{{.State.Health.Status}}' <container>`).

### Read-only mode and limits

The image runs as UID/GID `1001:1001` and writes nothing outside `/tmp`, so it works with the hardened container spec used by the service:

```bash
docker run -d \
  --read-only --tmpfs /tmp:rw,noexec,nosuid,nodev,size=64m \
  --cap-drop ALL --security-opt no-new-privileges \
  -m 256m --cpus 0.5 --pids-limit 256 \
  -e HIVE_USERNAME=alice -e PUBLIC_SITE_URL=https://alice.blogs.example \
  -p 4321:4321 my-honey-pot:latest
```

The Node heap is capped with `NODE_OPTIONS=--max-old-space-size=192` to stay inside the 256 MB memory limit. Raise both together if you change the limit.

### Branding

Optional operator branding is read at runtime (container restart is enough, no rebuild). Empty values hide the element; URLs must use `http` or `https`. The current hive-blog-service container spec does not pass these variables, so blogs created by it render without branding until the service adds them.

| Variable | Description |
| --- | --- |
| `BRANDING_NAME` | "Built by" name in the footer |
| `BRANDING_URL` | Link for the "Built by" name |
| `BRANDING_KOFI_URL` | Ko-fi button in the footer |
| `BRANDING_EDITOR_URL` | Link to the external blog editor |

## Admin Panel

Access the admin panel at `yourdomain.com/admin` to customize your blog.

### Login

1. Click "Login with Hive"
2. Enter your Hive username and posting key

**What is a posting key?** It's one of your Hive private keys that allows posting content and updating your blog settings.

**SECURITY WARNING**: NEVER use your master password, owner key, or active key. Only use your posting key. The key stays in your browser and is never sent to any server.

### Customization

You can customize: site title, description, layout style, colors, author profile visibility, comments, posts per page, and SEO settings.

### Saving changes

1. Make changes in the admin panel
2. Click "Save to Hive Blockchain"
3. Your settings are stored on the blockchain

**Note**: Saving costs Resource Credits (RC). New accounts may need to wait or get RC delegation. Learn more at [hive.io](https://hive.io).

## Questions?

Visit the demo site at [https://myhoneypot.bard-dev.com](https://myhoneypot.bard-dev.com) for more information, documentation, and examples.

For technical details and contribution guidelines, check the project repository.

## License

This project is licensed under the [GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0-or-later).

You are free to use, modify, and distribute this software. If you run a modified version on a network server, you must make the modified source code available to users.

---

Built with Hive blockchain technology - decentralized, transparent, and censorship-resistant.
