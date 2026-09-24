import { build } from 'esbuild';
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('.fixture-build');
await mkdir(output, { recursive: true });
await Promise.all([
  build({ entryPoints: ['tests/fixtures/codemirror.ts'], outfile: resolve(output, 'codemirror.js'), bundle: true, format: 'iife', target: 'chrome120' }),
  build({ entryPoints: ['src/content.ts'], outfile: resolve(output, 'content.js'), bundle: true, format: 'iife', target: 'chrome120' }),
]);

const page = `<!doctype html><html><head><meta charset="utf-8"><title>Native editor fixture</title><link rel="stylesheet" href="/content.css"></head><body><main><h1>README.md fixture</h1><div id="editor"></div></main><script src="/codemirror.js"></script><script src="/content.js"></script></body></html>`;
const issuePage = `<!doctype html><html><head><meta charset="utf-8"><title>Issue editor fixture</title><link rel="stylesheet" href="/content.css"></head><body><main><h1>Issue fixture</h1>${['problem', 'solution', 'context'].map((id) => `<section><h2>${id}</h2><markdown-toolbar for="${id}"><button type="button">Bold</button></markdown-toolbar><textarea id="${id}"></textarea></section>`).join('')}<section><h2>code</h2><textarea id="code"></textarea></section></main><script src="/content.js"></script></body></html>`;
const port = Number(process.env.FIXTURE_PORT || 8765);
createServer(async (request, response) => {
  if (request.url === '/codemirror.js' || request.url === '/content.js') {
    response.setHeader('content-type', 'text/javascript; charset=utf-8');
    response.end(await readFile(resolve(output, request.url.slice(1))));
  } else if (request.url === '/content.css') {
    response.setHeader('content-type', 'text/css; charset=utf-8');
    response.end(await readFile(resolve('src/content.css')));
  } else if (request.url?.startsWith('/owner/repo/edit/')) {
    response.setHeader('content-type', 'text/html; charset=utf-8');
    response.end(page);
  } else if (request.url?.startsWith('/owner/repo/issues/')) {
    response.setHeader('content-type', 'text/html; charset=utf-8');
    response.end(issuePage);
  } else {
    response.statusCode = 404;
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`Fixture ready at http://127.0.0.1:${port}/owner/repo/edit/main/README.md\n`);
});
