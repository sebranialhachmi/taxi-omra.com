# Deploying to Hostinger (Node.js)

The app is a server-rendered TanStack Start site. Hostinger plans that serve
only static files (Premium/Single shared hosting) cannot run it. You need a
plan with **Node.js Web Apps** (Business / Cloud) or a **VPS**.

## Build

```bash
npm install
npm run build:node     # NITRO_PRESET=node-server -> .output/
npm start              # node .output/server/index.mjs, reads PORT
```

`npm run build` (no preset) produces the Cloudflare/Lovable build and must not
be used on Hostinger.

## Hostinger Node.js Web App (hPanel)

1. hPanel -> Websites -> Add website -> **Node.js Apps** -> import the GitHub
   repo `sebranialhachmi/taxi-omra.com`, branch `main` (or upload a zip).
2. Framework: other / custom. Node version 20 or 22.
3. Build command: `npm install && npm run build:node`
4. Start command: `npm start`  (entry file `.output/server/index.mjs`)
5. Environment variables (optional, defaults are baked in at build time):
   `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SITE_URL=https://taxi-omra.com`
6. Connect the domain `taxi-omra.com` and enable the free SSL certificate.
   Force HTTPS in hPanel. Keep the apex domain as the canonical host
   (`src/server.ts` redirects www and http to `https://taxi-omra.com`).

## VPS alternative

```bash
git clone https://github.com/sebranialhachmi/taxi-omra.com && cd taxi-omra.com
npm ci && npm run build:node
PORT=3000 pm2 start .output/server/index.mjs --name taxi-omra
```
Put Nginx in front (proxy_pass to 127.0.0.1:3000, pass `Host` and
`X-Forwarded-Proto`) and issue a certificate with certbot.

## After deploy

```bash
node scripts/seo-check.mjs https://taxi-omra.com
curl -I https://taxi-omra.com/robots.txt
```
Supabase must be reachable from the server and the project must not be paused.
Then add the property in Search Console and submit `sitemap-index.xml`.
