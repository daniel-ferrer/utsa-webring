#!/usr/bin/env node
/**
 * Pull request helper: for members added or changed compared with the base
 * branch, check that the site responds and whether it links back to the ring.
 * Prints a Markdown summary for the job summary. Informational only: it never
 * fails the build.
 *
 *   node scripts/check-new-sites.mjs --base <base members.json>
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { mdCell } from './lib/markdown.mjs';
import { diffMembers, readJson } from './lib/members.mjs';
import { describe, linksBack, mapConcurrent, probe } from './lib/probe.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { values: args } = parseArgs({
  options: {
    data: { type: 'string', default: path.join(ROOT, 'data', 'members.json') },
    base: { type: 'string' },
  },
});

const head = await readJson(path.resolve(args.data));
const base = args.base ? await readJson(path.resolve(args.base)) : { members: [] };
const { added, changed, removed } = diffMembers(base.members ?? [], head.members);
const toCheck = [...added, ...changed];

const lines = ['### Member changes', ''];
if (toCheck.length === 0 && removed.length === 0) {
  lines.push('No member entries were added, changed or removed.');
} else {
  if (toCheck.length > 0) {
    const rows = await mapConcurrent(toCheck, 4, async (member) => {
      const result = await probe(member.website, { readBody: true, retries: 1 });
      const outcome = mdCell(describe(result));
      const reachable = result.ok ? `yes (${outcome})` : `**no** (${outcome})`;
      const backlink = result.body ? (linksBack(result.body) ? 'yes' : 'not yet') : 'unknown';
      const kind = added.includes(member) ? 'added' : 'changed';
      return `| \`${member.id}\` | ${kind} | ${mdCell(member.website)} | ${reachable} | ${backlink} |`;
    });
    lines.push('| Member | Change | Website | Reachable | Links back to the ring |', '|---|---|---|---|---|', ...rows);
  }
  if (removed.length > 0) {
    lines.push('', `Removed: ${removed.map((member) => `\`${member.id}\``).join(', ')}`);
  }
}
lines.push('', '_Linking back is encouraged, not required. Reachability problems are worth a look before merging._');

console.log(lines.join('\n'));
