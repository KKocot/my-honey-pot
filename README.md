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
