#!/usr/bin/env node
/**
 * Serve dist/ locally, roughly the way Cloudflare Pages does: static files,
 * directory index.html, 404.html, and the rules in _redirects.
 * For local development only.
 *
 *   node scripts/serve.mjs [--port 8080]
 */
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const { values: args } = parseArgs({ options: { port: { type: 'string', default: '8080' } } });

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const redirects = await loadRedirects();

function loadRedirects() {
  return readFile(path.join(ROOT, '_redirects'), 'utf8')
    .then((text) =>
      text
        .split('\n')
        .map((line) => line.trim().split(/\s+/))
        .filter((parts) => parts.length === 3)
        .map(([from, to, status]) => ({ pattern: toPattern(from), to, status: Number(status) })),
    )
    .catch(() => []);
}

/** Turn "/:id/next" into a RegExp with named groups. */
function toPattern(from) {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:(\w+)/g, '(?<$1>[^/]+)');
  return new RegExp(`^${escaped}$`);
}

function matchRedirect(pathname) {
  for (const rule of redirects) {
    const match = rule.pattern.exec(pathname);
    if (match) {
      const to = rule.to.replace(/:(\w+)/g, (_, name) => match.groups?.[name] ?? '');
      return { to, status: rule.status };
    }
  }
  return null;
}

/** Resolve a URL path to a file inside dist/, or null. Never escapes dist/. */
async function resolveFile(pathname) {
  const candidate = path.resolve(ROOT, `.${decodeURIComponent(pathname)}`);
  if (candidate !== ROOT && !candidate.startsWith(ROOT + path.sep)) return null;
  for (const file of [candidate, path.join(candidate, 'index.html')]) {
    try {
      if ((await stat(file)).isFile()) return file;
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

const server = createServer(async (request, response) => {
  try {
    const { pathname } = new URL(request.url, 'http://localhost');
    const file = await resolveFile(pathname);
    if (file) {
      response.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
      createReadStream(file).pipe(response);
      return;
    }
    const redirect = matchRedirect(pathname);
    if (redirect) {
      response.writeHead(redirect.status, { location: redirect.to });
      response.end();
      return;
    }
    response.writeHead(404, { 'content-type': TYPES['.html'] });
    createReadStream(path.join(ROOT, '404.html')).pipe(response);
  } catch {
    response.writeHead(400);
    response.end('Bad request');
  }
});

server.listen(Number(args.port), '127.0.0.1', () => {
  console.log(`Serving dist/ at http://127.0.0.1:${args.port}`);
});
