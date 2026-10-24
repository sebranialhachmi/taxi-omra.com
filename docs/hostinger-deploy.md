# Deploying to Hostinger (Node.js + MySQL)

The site is server-rendered (TanStack Start) and stores its content in MySQL. It needs a Hostinger plan
with **Node.js Apps** (Business / Cloud) or a VPS. Plain shared "Premium" hosting cannot run it.

## 1. Create the database (hPanel → Databases → MySQL Databases)
Create a database and a user, and note the three names plus the password. On Hostinger the host is `localhost`.

## 2. Create the Node.js app
hPanel → Websites → Add website → **Node.js Apps** → import `sebranialhachmi/taxi-omra.com`, branch `main`.

| Setting | Value |
|---|---|
| Framework preset | Nitro |
| Node version | 22.x |
| Build command | `npm run build:node` |
| Output directory | `.output` |
| Entry file | `server/index.mjs` |

## 3. Environment variables
| Name | Value |
|---|---|
| `NITRO_PRESET` | `node-server` |
| `VITE_SITE_URL` | `https://taxi-omra.com` |
| `DATABASE_URL` | `mysql://DB_USER:DB_PASSWORD@localhost:3306/DB_NAME` |
| `ADMIN_EMAIL` | the email you will log in with |
| `ADMIN_PASSWORD` | a long password (10+ characters) |

If the password contains characters like `@ : / #`, URL-encode it in `DATABASE_URL`
(or use `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` instead of `DATABASE_URL`).

## 4. First start
On the first request after every start the server creates any missing tables, loads the starter content
(`content/seed`) into empty tables, and creates the admin account if it does not exist. Nothing to run by hand.
Then open `https://taxi-omra.com/admin` and sign in. You can change the password under Settings.

Forgot the password? Set `ADMIN_PASSWORD` to a new value and `ADMIN_FORCE_RESET=1`, redeploy, sign in,
then remove `ADMIN_FORCE_RESET`.

## Daily use
- **Prices**: /admin → الأسعار. Changes show on the site immediately.
- **Pages / articles / FAQ**: edit in the admin. "السماح لجوجل بفهرستها" decides whether Google may index a page.
- **Messages**: contact and booking-request forms land in /admin → الرسائل (booking itself is on WhatsApp).
- **Phone / WhatsApp / tracking codes**: /admin → الإعدادات.

## After deploy
```bash
node scripts/seo-check.mjs https://taxi-omra.com
curl -I https://taxi-omra.com/robots.txt
```
Add the site to Google Search Console and submit `https://taxi-omra.com/sitemap-index.xml`.

## Local development
```bash
cp .env.example .env     # fill DATABASE_URL (MySQL/MariaDB) and ADMIN_EMAIL / ADMIN_PASSWORD
npm install
npm run dev
```
