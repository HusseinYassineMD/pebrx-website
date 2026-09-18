import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');
const sourceDir = join(root, 'images/heroes');
const outputDir = join(root, 'public/images/heroes');
const widths = [960, 1280, 1920];
const heroes = [
  'about-hero',
  'science-hero',
  'pipeline-hero',
  'leadership-hero',
  'publications-hero',
  'contact-hero',
];

await mkdir(outputDir, { recursive: true });

for (const name of heroes) {
  const sourcePath = join(sourceDir, `${name}.jpg`);
  const metadata = await sharp(sourcePath).metadata();
  const aspect = (metadata.height ?? 960) / (metadata.width ?? 3840);

  for (const width of widths) {
    const height = Math.round(width * aspect);
    const resized = sharp(sourcePath).resize(width, height, {
      fit: 'cover',
      withoutEnlargement: true,
    });

    await resized.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(join(outputDir, `${name}-${width}.jpg`));
    await resized.clone().webp({ quality: 82 }).toFile(join(outputDir, `${name}-${width}.webp`));
  }

  console.log(`Optimized ${name}`);
}

await copyFile(join(sourceDir, 'neural-overlay.svg'), join(outputDir, 'neural-overlay.svg'));
console.log('Hero images ready in public/images/heroes');
