#!/usr/bin/env node
/**
 * Render the social preview image (src/assets/img/og-image.png, 1200x630)
 * with headless Chrome. Run it again after changing the design or the
 * decorations it reuses; the PNG is committed so the site build stays
 * dependency-free.
 *
 *   node scripts/og-image.mjs                    find Chrome in the usual places
 *   node scripts/og-image.mjs --chrome <path>    use a specific Chrome or Chromium
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs, promisify } from 'node:util';

import { renderPapelPicado, renderTileStrip } from './lib/decor.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'assets', 'img', 'og-image.png');
const WIDTH = 1200;
const HEIGHT = 630;

const CHROME_CANDIDATES = {
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ],
  darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
  linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'],
};

const { values: args } = parseArgs({ options: { chrome: { type: 'string' } } });

async function main() {
  const chrome = args.chrome ?? process.env.CHROME_PATH ?? (CHROME_CANDIDATES[process.platform] ?? []).find(existsSync);
  if (!chrome) throw new Error('Chrome not found. Pass --chrome <path> or set CHROME_PATH.');

  const work = await mkdtemp(path.join(os.tmpdir(), 'og-image-'));
  try {
    const page = path.join(work, 'og-image.html');
    await writeFile(page, renderHtml());
    await promisify(execFile)(chrome, [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      `--user-data-dir=${path.join(work, 'profile')}`,
      `--window-size=${WIDTH},${HEIGHT}`,
      '--virtual-time-budget=3000',
      `--screenshot=${OUT}`,
      pathToFileURL(page).href,
    ]);
  } finally {
    await rm(work, { recursive: true, force: true });
  }

  const { size } = await stat(OUT);
  console.log(`Wrote ${path.relative(ROOT, OUT)} (${Math.round(size / 1024)} KB)`);
}

function renderHtml() {
  const font = (name) => pathToFileURL(path.join(ROOT, 'src', 'assets', 'fonts', name)).href;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @font-face { font-family: "Fraunces"; font-weight: 100 900; src: url("${font('fraunces-latin-wght-normal.woff2')}") format("woff2"); }
  @font-face { font-family: "Work Sans"; font-weight: 100 900; src: url("${font('work-sans-latin-wght-normal.woff2')}") format("woff2"); }
  :root {
    --c-sand: #f5ede0; --c-ink: #2a1f1a; --c-ink-soft: #5c4a3f; --c-terracotta: #a8432a;
    --c-teal: #1d6b6b; --c-marigold: #e0a526; --c-rosa: #c2457a; --c-plum: #7a4fa0; --track: #c9b9a6;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body { position: relative; background: var(--c-sand); color: var(--c-ink); font-family: "Work Sans", sans-serif; }
  .swatch-0 { --swatch: var(--c-terracotta); } .swatch-1 { --swatch: var(--c-teal); }
  .swatch-2 { --swatch: var(--c-marigold); } .swatch-3 { --swatch: var(--c-rosa); } .swatch-4 { --swatch: var(--c-plum); }
  .picado { display: block; width: 100%; height: 92px; }
  .picado-string { stroke: var(--c-ink-soft); stroke-width: 2; }
  .picado-flag { fill: var(--swatch); }
  .tile-strip { position: absolute; bottom: 0; left: 0; display: block; }
  .tile-ground { fill: var(--c-teal); } .tile-star { fill: var(--c-sand); }
  .tile-center { fill: var(--c-marigold); } .tile-corner { fill: var(--c-terracotta); }
  .text { position: absolute; left: 80px; top: 178px; width: 640px; }
  h1 { margin: 0; font-family: "Fraunces", serif; font-size: 92px; font-weight: 700; line-height: 1; letter-spacing: -0.02em; white-space: nowrap; }
  .tagline { margin: 28px 0 0; color: var(--c-ink-soft); font-size: 34px; line-height: 1.3; }
  .url { margin: 36px 0 0; color: var(--c-terracotta); font-size: 30px; font-weight: 600; }
  .note { margin: 8px 0 0; color: var(--c-ink-soft); font-size: 20px; }
  .ring { position: absolute; right: 70px; top: 140px; width: 400px; height: 400px; }
  .track { fill: none; stroke: var(--track); stroke-width: 3; stroke-dasharray: 3 10; stroke-linecap: round; }
  .node { fill: var(--swatch); }
  .open { fill: var(--c-sand); stroke: var(--c-terracotta); stroke-width: 3; stroke-dasharray: 6 5; }
  .plus { stroke: var(--c-terracotta); stroke-width: 4; stroke-linecap: round; }
  .arrow { fill: none; stroke: var(--c-terracotta); stroke-width: 4; }
  .arrowhead { fill: var(--c-terracotta); }
</style>
</head>
<body>
${renderPapelPicado()}
<div class="text">
  <h1>utsa-webring</h1>
  <p class="tagline">A webring of personal sites by UTSA students &amp; alumni in tech.</p>
  <p class="url">utsa-webring.com</p>
  <p class="note">Student-run and unofficial</p>
</div>
${renderRing()}
${renderTileStrip()}
</body>
</html>
`;
}

/** A generic loop: colored member nodes, an arrow for direction and an open spot for the next member. */
function renderRing() {
  const center = 200;
  const radius = 150;
  const count = 8;
  const at = (i, r = radius) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)].map((v) => v.toFixed(1));
  };
  const nodes = Array.from({ length: count - 1 }, (_, i) => {
    const [x, y] = at(i);
    return `<circle class="node swatch-${i % 5}" cx="${x}" cy="${y}" r="30"/>`;
  });
  const [ox, oy] = at(count - 1);
  const [ax, ay] = at(0.42, radius + 52);
  const [bx, by] = at(0.78, radius + 52);
  return [
    '<svg class="ring" viewBox="0 0 400 400" aria-hidden="true">',
    `<circle class="track" cx="${center}" cy="${center}" r="${radius}"/>`,
    `<path class="arrow" d="M${ax} ${ay}A${radius + 52} ${radius + 52} 0 0 1 ${bx} ${by}"/>`,
    `<polygon class="arrowhead" points="0,-10 18,0 0,10" transform="translate(${bx} ${by}) rotate(${(-90 + (360 * 0.78) / count + 90).toFixed(1)})"/>`,
    ...nodes,
    `<circle class="open" cx="${ox}" cy="${oy}" r="30"/>`,
    `<path class="plus" d="M${ox - 11} ${oy}h22M${ox} ${oy - 11}v22"/>`,
    '</svg>',
  ].join('\n');
}

await main();
