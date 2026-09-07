import type { Plugin } from 'vite';
import { buildSeoTags, getPageMeta, getSiteUrl } from './site-meta';

export function seoPlugin(): Plugin {
  return {
    name: 'pebrx-seo',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const filename = ctx.filename.split(/[/\\]/).pop() ?? '';
        const meta = getPageMeta(filename, getSiteUrl().replace(/\/$/, ''));
        if (!meta) return html;

        let output = html;

        output = output.replace(
          /<meta name="description" content="[^"]*">/,
          `<meta name="description" content="${meta.description.replace(/"/g, '&quot;')}">`,
        );
        output = output.replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`);

        const seo = buildSeoTags(filename);
        if (output.includes('<!-- pebrx-seo -->')) {
          return output.replace('<!-- pebrx-seo -->', seo);
        }

        return output.replace('</head>', `  ${seo}\n</head>`);
      },
    },
  };
}
