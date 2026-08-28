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

Submits via `mailto:contact@pebrx.co` (opens the user's email client).
