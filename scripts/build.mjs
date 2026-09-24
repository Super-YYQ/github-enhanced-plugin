import { build } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('dist');
await mkdir(output, { recursive: true });
await build({
  entryPoints: ['src/content.ts'],
  outfile: resolve(output, 'content.js'),
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  sourcemap: false,
  minify: true,
});
await Promise.all([
  copyFile('manifest.json', resolve(output, 'manifest.json')),
  copyFile('src/content.css', resolve(output, 'content.css')),
]);
