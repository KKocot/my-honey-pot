FROM node:24-alpine AS base

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.34.6 --activate

WORKDIR /app

FROM base AS builder

COPY package.json pnpm-lock.yaml .npmrc ./

# postinstall copies hb-auth assets into public/auth/assets, so it must run before the build
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM base AS prod-deps

COPY package.json pnpm-lock.yaml .npmrc ./

# Scripts skipped: postinstall only feeds public/, which is already baked into dist/client
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

FROM node:24-alpine AS runner

WORKDIR /app

RUN addgroup -S -g 1001 nodejs && \
    adduser -S -D -H -u 1001 -G nodejs astro

COPY --from=prod-deps --chown=1001:1001 /app/node_modules ./node_modules
COPY --from=builder --chown=1001:1001 /app/dist ./dist
COPY --from=builder --chown=1001:1001 /app/package.json ./

ENV HOST=0.0.0.0 \
    PORT=4321 \
    NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=192

USER 1001:1001

EXPOSE 4321

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||4321)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "./dist/server/entry.mjs"]
