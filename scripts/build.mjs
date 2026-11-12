#!/usr/bin/env node
/**
 * Build the static site into dist/.
 *
 *   node scripts/build.mjs                       real data (data/members.json)
 *   node scripts/build.mjs --data <file>         another members file
 *   node scripts/build.mjs --fake <count>        generated members, to preview the loop at scale
 */
import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { MAX_STATIC_REDIRECTS, SITE } from './lib/config.mjs';
import { readJson, validateMembers } from './lib/members.mjs';
import { renderPages } from './lib/pages.mjs';
import { redirectRules } from './lib/ring.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist');

const { values: args } = parseArgs({
  options: {
    data: { type: 'string', default: path.join(ROOT, 'data', 'members.json') },
    fake: { type: 'string' },
  },
});

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const schema = await readJson(path.join(ROOT, 'data', 'members.schema.json'));
  const doc = args.fake ? fakeMembers(Number(args.fake), today) : await readJson(path.resolve(args.data));

  const { errors } = validateMembers(doc, schema);
  if (errors.length > 0) {
    console.error(`Invalid members data:\n  ${errors.join('\n  ')}`);
    process.exit(1);
  }
  const { members } = doc;

  const redirects = redirectRules(members);
  if (redirects.staticCount > MAX_STATIC_REDIRECTS) {
    throw new Error(`${redirects.staticCount} redirect rules exceed the Cloudflare Pages limit of ${MAX_STATIC_REDIRECTS}`);
  }

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await cp(path.join(SRC, 'assets'), path.join(OUT, 'assets'), { recursive: true });
  await cp(path.join(SRC, 'static'), OUT, { recursive: true });

  const asset = await assetUrls(path.join(SRC, 'assets'));
  const templates = await readTemplates();
  const pages = renderPages({ members, templates, asset, today });

  for (const [file, html] of Object.entries(pages)) {
    const target = path.join(OUT, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html);
  }

  await writeFile(path.join(OUT, '_redirects'), `${redirects.lines.join('\n')}\n`);
  await writeFile(
    path.join(OUT, 'members.json'),
    `${JSON.stringify({ name: SITE.name, url: SITE.url, members }, null, 2)}\n`,
  );

  console.log(`Built ${Object.keys(pages).length} pages for ${members.length} members into dist/`);
}

async function readTemplates() {
  const read = (name) => readFile(path.join(SRC, 'templates', name), 'utf8');
  const [layout, index, join, random, notFound] = await Promise.all(
    ['layout.html', 'index.html', 'join.html', 'random.html', '404.html'].map(read),
  );
  return { layout, index, join, random, notFound };
}

/** Map asset paths to URLs with a content hash, so browsers refetch only on change. */
async function assetUrls(dir) {
  const hashes = new Map();
  for (const entry of await readdir(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const full = path.join(entry.parentPath, entry.name);
    const relative = path.relative(dir, full).split(path.sep).join('/');
    hashes.set(relative, createHash('sha256').update(await readFile(full)).digest('hex').slice(0, 10));
  }
  return (relative) => {
    if (!hashes.has(relative)) throw new Error(`Unknown asset: ${relative}`);
    return `/assets/${relative}?v=${hashes.get(relative)}`;
  };
}

/** Clearly fictional members on reserved .example domains, for previews only. */
function fakeMembers(count, today) {
  if (!Number.isInteger(count) || count < 0 || count > 1000) throw new Error('--fake must be an integer from 0 to 1000');
  const first = ['Ana', 'Marcus', 'Priya', 'Diego', 'Sam', 'Lily', 'Jordan', 'Noor', 'Bea', 'Luis', 'Maya', 'Omar'];
  const last = ['Ramírez', 'Lee', 'Natarajan', 'Herrera', 'Okafor', 'Tran', 'Castillo', 'Haddad', 'Wong', 'Garza'];
  const majors = ['Computer Science', 'Cybersecurity', 'Data Science', 'Computer Engineering', 'Information Systems'];
  const year = Number(today.slice(0, 4));
  return {
    members: Array.from({ length: count }, (_, i) => ({
      id: `sample-${i + 1}`,
      name: `${first[i % first.length]} ${last[(i * 7) % last.length]}`,
      gradYear: year - 3 + (i % 8),
      major: majors[i % majors.length],
      website: `https://sample-${i + 1}.example/`,
      joined: today,
    })),
  };
}

await main();
