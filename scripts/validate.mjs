#!/usr/bin/env node
/**
 * Validate data/members.json.
 *
 *   node scripts/validate.mjs                      schema and content rules
 *   node scripts/validate.mjs --base <file>        also compare with the base branch's copy
 *
 * Exits non-zero when there are errors. Warnings (for example, a PR that edits
 * several existing entries) are printed but don't fail.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { diffMembers, readJson, validateMembers } from './lib/members.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { values: args } = parseArgs({
  options: {
    data: { type: 'string', default: path.join(ROOT, 'data', 'members.json') },
    base: { type: 'string' },
  },
});

const schema = await readJson(path.join(ROOT, 'data', 'members.schema.json'));
const doc = await readJson(path.resolve(args.data));
const { errors } = validateMembers(doc, schema);
const warnings = [];

if (errors.length === 0 && args.base) {
  const base = await readJson(path.resolve(args.base));
  const diff = diffMembers(base.members ?? [], doc.members);
  errors.push(...diff.errors);
  warnings.push(...diff.warnings);
  const summary = (label, list) => (list.length ? `${label}: ${list.map((m) => m.id).join(', ')}` : null);
  const lines = [summary('Added', diff.added), summary('Changed', diff.changed), summary('Removed', diff.removed)];
  console.log(lines.filter(Boolean).join('\n') || 'No member changes.');
}

for (const warning of warnings) console.warn(`warning: ${warning}`);
for (const error of errors) console.error(`error: ${error}`);

if (errors.length > 0) {
  process.exitCode = 1;
} else {
  const count = doc.members.length;
  console.log(`members.json is valid (${count} ${count === 1 ? 'member' : 'members'}).`);
}
