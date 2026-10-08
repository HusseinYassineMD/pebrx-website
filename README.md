# PebRx Website

A multi-page marketing site for PebRx — precision therapeutics for APOE4-driven neurovascular disease.

Built with **HTML**, **CSS**, **TypeScript**, and **Vite**.

## Pages

| Page | URL |
|------|-----|
| Home (landing) | `/` |
| Science | `/science.html` |
| About (redirect) | `/about.html` → Science |
| Pipeline | `/pipeline.html` |
| Leadership | `/leadership.html` |
| Publications | `/publications.html` |
| Contact | `/contact.html` |

## Development

```bash
cd pebrx-website
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Production build

```bash
npm run build
npm run preview
```

Output goes to `dist/`.

## Tech stack

- **Vite** — dev server and production bundler
- **TypeScript** — navigation, mobile menu, scroll animations, contact form
- **Vanilla CSS** — responsive layout, teal/seafoam/navy theme
- **Static HTML** — one landing page + separate content pages

## Assets

Images live in `public/images/` (logo, team headshots, etc.).

## Contact form

Submissions are sent by email via [Web3Forms](https://web3forms.com) (no database, no backend server).

1. Sign up at [web3forms.com](https://web3forms.com) with the inbox that should receive leads (e.g. `contact@pebrx.co`).
2. Copy your **Access Key**.
3. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**  
   Name: `WEB3FORMS_ACCESS_KEY` · Value: your access key.
4. Re-run the **Deploy to GitHub Pages** workflow (or push to `main`).

Optional: in the Web3Forms dashboard, restrict submissions to `https://www.pebrx.co`.

Local testing: copy `.env.example` to `.env.local` and set `VITE_WEB3FORMS_ACCESS_KEY`.
