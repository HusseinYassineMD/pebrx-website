import type { Plugin } from 'vite';
import { buildSeoTags, getPageMeta, getSiteUrl } from './site-meta';
import { buildHeroPreload, PAGE_HEROES } from './src/hero-images';

const FONT_LINKS =
  /[ \t]*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n[ \t]*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\n[ \t]*<link href="https:\/\/fonts\.googleapis\.com\/css2[^"]+" rel="stylesheet">\n?/g;

const CRITICAL_HERO_CSS = `<style>
.hero,.page-hero-banner,.hero-landing-photo{position:relative;overflow:hidden;background:#0a1628}
.hero-landing-photo picture,.page-hero-banner picture{position:absolute;inset:0;display:block;width:100%;height:100%;z-index:0}
.hero-landing-photo .hero-photo,.page-hero-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
</style>`;

export function seoPlugin(): Plugin {
  return {
    name: 'pebrx-seo',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const filename = ctx.filename.split(/[/\\]/).pop() ?? '';
        const meta = getPageMeta(filename, getSiteUrl().replace(/\/$/, ''));
        if (!meta) return html;

        let output = html.replace(FONT_LINKS, '');

        output = output.replace(
          /<meta name="description" content="[^"]*">/,
          `<meta name="description" content="${meta.description.replace(/"/g, '&quot;')}">`,
        );
        output = output.replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`);

        const seo = buildSeoTags(filename);
        const heroBase = PAGE_HEROES[filename];
        const heroPreload = heroBase ? `\n  ${buildHeroPreload(heroBase)}` : '';

        const headExtras = `${CRITICAL_HERO_CSS}\n  ${heroPreload}\n  ${seo}`;

        if (output.includes('<!-- pebrx-seo -->')) {
          return output.replace('<!-- pebrx-seo -->', headExtras);
        }

        return output.replace('</head>', `  ${headExtras}\n</head>`);
      },
    },
  };
}
