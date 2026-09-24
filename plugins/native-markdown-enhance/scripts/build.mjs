import { build } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('dist');
await mkdir(output, { recursive: true });
await build({
  entryPoints: {
    content: 'src/content.ts',
    background: 'src/background.ts',
    options: 'src/options.ts',
  },
  outdir: output,
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  sourcemap: false,
  minify: true,
});
await Promise.all([
  copyFile('manifest.json', resolve(output, 'manifest.json')),
  copyFile('src/content.css', resolve(output, 'content.css')),
  copyFile('src/options.html', resolve(output, 'options.html')),
  copyFile('src/options.css', resolve(output, 'options.css')),
]);
await mkdir(resolve(output, 'icons'), { recursive: true });
await Promise.all([16, 32, 48, 128].map((size) =>
  copyFile(`assets/icon${size}.png`, resolve(output, `icons/icon${size}.png`))));
