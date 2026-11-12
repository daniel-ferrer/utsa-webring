import { readFile } from 'node:fs/promises';

/** Sites that are profiles, shorteners or link-in-bio pages rather than a member's own site. */
const DISALLOWED_HOSTS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'linktr.ee',
  'lnk.bio',
  'beacons.ai',
  'bio.link',
  'carrd.co',
  'linkedin.com',
  'github.com',
  'gitlab.com',
  'x.com',
  'twitter.com',
  'instagram.com',
  'tiktok.com',
  'facebook.com',
]);

/** Control characters, invisible formatting and bidirectional overrides, which can spoof how text renders. */
const UNSAFE_TEXT = /[\u0000-\u001f\u007f-\u009f\u200b\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufeff]/u;

const MAX_YEARS_AHEAD = 7;

export async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

/**
 * Validate `value` against the subset of JSON Schema used by
 * data/members.schema.json: type, required, properties, additionalProperties,
 * items, enum, pattern, minLength/maxLength and minimum/maximum.
 */
export function schemaErrors(value, schema, path = 'members.json') {
  const errors = [];
  const fail = (message) => errors.push(`${path}: ${message}`);

  if (schema.enum && !schema.enum.includes(value)) {
    fail(`must be one of ${schema.enum.join(', ')}`);
    return errors;
  }
  if (schema.type && !matchesType(value, schema.type)) {
    fail(`must be of type ${schema.type}`);
    return errors;
  }

  if (typeof value === 'string') {
    const length = Array.from(value).length;
    if (schema.minLength !== undefined && length < schema.minLength) fail(`must be at least ${schema.minLength} characters`);
    if (schema.maxLength !== undefined && length > schema.maxLength) fail(`must be at most ${schema.maxLength} characters`);
    if (schema.pattern && !new RegExp(schema.pattern, 'u').test(value)) fail(`must match ${schema.pattern}`);
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) fail(`must be >= ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) fail(`must be <= ${schema.maximum}`);
  }

  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => errors.push(...schemaErrors(item, schema.items, `${path}[${index}]`)));
  }

  if (matchesType(value, 'object')) {
    for (const key of schema.required ?? []) {
      if (!Object.hasOwn(value, key)) fail(`missing required field "${key}"`);
    }
    for (const [key, child] of Object.entries(value)) {
      const childSchema = schema.properties?.[key];
      if (childSchema) {
        errors.push(...schemaErrors(child, childSchema, `${path}.${key}`));
      } else if (schema.additionalProperties === false) {
        fail(`unknown field "${key}"`);
      }
    }
  }

  return errors;
}

function matchesType(value, type) {
  switch (type) {
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    case 'integer':
      return Number.isInteger(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    default:
      return typeof value === type;
  }
}

/** Key used to detect the same site listed twice. */
export function websiteKey(website) {
  const url = new URL(website);
  return (url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/+$/, '')).toLowerCase();
}

/** Problems with a member's website URL, as human-readable strings. */
export function websiteProblems(website) {
  let url;
  try {
    url = new URL(website);
  } catch {
    return ['is not a valid URL'];
  }
  const problems = [];
  if (website !== url.href) problems.push(`must be written exactly as ${url.href}`);
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (url.protocol !== 'https:') problems.push('must use https://');
  if (url.username || url.password) problems.push('must not contain a username or password');
  if (url.search || url.hash) problems.push('must not contain a query string or #fragment');
  if (url.port) problems.push('must not use a custom port');
  if (/^\d+(\.\d+){3}$/.test(host) || host.startsWith('[')) problems.push('must use a domain name, not an IP address');
  if (!host.includes('.') || host.endsWith('.local') || host === 'localhost') problems.push('must be a public domain name');
  if (DISALLOWED_HOSTS.has(host)) problems.push(`must be your own site, not a ${host} page`);
  return problems;
}

/** Whether `yyyy-mm-dd` is a real calendar date. */
function isCalendarDate(text) {
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

/**
 * Validate a members document: the schema first, then rules the schema can't
 * express. Returns `{ errors }`; any error should block a merge.
 */
export function validateMembers(doc, schema, { today = new Date() } = {}) {
  const errors = schemaErrors(doc, schema);
  if (errors.length > 0) return { errors };

  const ids = new Map();
  const sites = new Map();
  const latestJoin = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const latestGradYear = today.getUTCFullYear() + MAX_YEARS_AHEAD;

  doc.members.forEach((member, index) => {
    const label = `members[${index}] (${member.id})`;

    if (ids.has(member.id)) errors.push(`${label}: id is already used by members[${ids.get(member.id)}]`);
    ids.set(member.id, index);

    for (const field of ['name', 'major']) {
      const value = member[field];
      if (value !== value.trim()) errors.push(`${label}: ${field} has leading or trailing spaces`);
      if (UNSAFE_TEXT.test(value)) errors.push(`${label}: ${field} contains invisible, control or bidirectional characters`);
    }

    const problems = websiteProblems(member.website);
    for (const problem of problems) errors.push(`${label}: website ${problem}`);
    if (problems.length === 0) {
      const key = websiteKey(member.website);
      if (sites.has(key)) errors.push(`${label}: website is already listed by members[${sites.get(key)}]`);
      sites.set(key, index);
    }

    if (!isCalendarDate(member.joined)) {
      errors.push(`${label}: joined must be a real date (YYYY-MM-DD)`);
    } else if (new Date(`${member.joined}T00:00:00Z`) > latestJoin) {
      errors.push(`${label}: joined is in the future`);
    }

    if (member.gradYear > latestGradYear) {
      errors.push(`${label}: gradYear must be ${latestGradYear} or earlier`);
    }
  });

  return { errors };
}

/**
 * Compare a pull request's members with the base branch. New members must be
 * appended at the end and existing members must keep their order, so nobody's
 * prev/next neighbors shift unexpectedly.
 */
export function diffMembers(baseMembers, headMembers) {
  const baseById = new Map(baseMembers.map((member) => [member.id, member]));
  const headIds = new Set(headMembers.map((member) => member.id));

  const added = headMembers.filter((member) => !baseById.has(member.id));
  const removed = baseMembers.filter((member) => !headIds.has(member.id));
  const changed = headMembers.filter(
    (member) => baseById.has(member.id) && !sameEntry(member, baseById.get(member.id)),
  );

  const errors = [];
  const warnings = [];

  const keptInHead = headMembers.filter((member) => baseById.has(member.id)).map((member) => member.id);
  const keptInBase = baseMembers.filter((member) => headIds.has(member.id)).map((member) => member.id);
  if (keptInHead.join('\n') !== keptInBase.join('\n')) {
    errors.push('Existing members were reordered. Ring order is join order; only append new entries.');
  }

  const lastKeptIndex = headMembers.findLastIndex((member) => baseById.has(member.id));
  for (const member of added) {
    if (headMembers.indexOf(member) < lastKeptIndex) {
      errors.push(`New member "${member.id}" must be added at the end of the list.`);
    }
  }

  if (changed.length + removed.length > 1) {
    warnings.push(
      `This change edits or removes ${changed.length + removed.length} existing entries. ` +
        'Member PRs should only touch their own entry; bulk changes need a maintainer.',
    );
  }

  return { added, changed, removed, errors, warnings };
}

function sameEntry(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((key) => a[key] === b[key]);
}
