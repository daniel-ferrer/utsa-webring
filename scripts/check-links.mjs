#!/usr/bin/env node
/**
 * Scheduled dead-link check for member sites (twice a week in CI).
 *
 *   node scripts/check-links.mjs --state <file> --report <file>
 *
 * `--state` holds consecutive failure counts from earlier runs; it is read if
 * present and rewritten. A site is only reported after failing two runs in a
 * row, which filters out brief outages. The Markdown report is written only
 * when something should be reported.
 */
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { mdCell } from './lib/markdown.mjs';
import { readJson } from './lib/members.mjs';
import { describe, mapConcurrent, probe } from './lib/probe.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STRIKES_TO_REPORT = 2;
const CONCURRENCY = 8;

const { values: args } = parseArgs({
  options: {
    data: { type: 'string', default: path.join(ROOT, 'data', 'members.json') },
    state: { type: 'string', default: '.link-check-state.json' },
    report: { type: 'string', default: 'link-report.md' },
  },
});

const { members } = await readJson(path.resolve(args.data));
const previous = await readFile(args.state, 'utf8').then(JSON.parse).catch(() => ({}));

const results = await mapConcurrent(members, CONCURRENCY, async (member) => ({
  member,
  result: await probe(member.website),
}));

const state = {};
const failing = [];
for (const { member, result } of results) {
  if (result.ok) continue;
  const strikes = (previous[member.website] ?? 0) + 1;
  state[member.website] = strikes;
  if (strikes >= STRIKES_TO_REPORT) failing.push({ member, result, strikes });
}

await writeFile(args.state, `${JSON.stringify(state, null, 2)}\n`);
await rm(args.report, { force: true });

console.log(`Checked ${members.length} sites: ${Object.keys(state).length} failing now, ${failing.length} reportable.`);

if (failing.length > 0) {
  const rows = failing.map(
    ({ member, result, strikes }) =>
      `| ${mdCell(member.name)} (\`${member.id}\`) | ${mdCell(member.website)} | ${mdCell(describe(result))} | ${strikes} |`,
  );
  const report = [
    'These member sites failed the scheduled link check at least twice in a row.',
    '',
    '| Member | Website | Result | Failed runs |',
    '|---|---|---|---|',
    ...rows,
    '',
    'Next steps for maintainers: contact each member (for example on their join PR).',
    'If a site is still down 30 days after first being reported, remove the entry in a PR titled `remove: <name> (dead link)`.',
    'This issue updates itself after every check and closes when every site responds again.',
    '',
  ].join('\n');
  await writeFile(args.report, report);
}
