import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { diffMembers, validateMembers, websiteProblems } from '../scripts/lib/members.mjs';

const schema = JSON.parse(readFileSync(new URL('../data/members.schema.json', import.meta.url), 'utf8'));
const sample = JSON.parse(readFileSync(new URL('./fixtures/members.sample.json', import.meta.url), 'utf8'));
const today = new Date('2026-11-11T12:00:00Z');

const member = (overrides = {}) => ({
  id: 'ana-ramirez',
  name: 'Ana Ramírez',
  gradYear: 2026,
  major: 'Computer Science',
  website: 'https://ana-ramirez.example/',
  joined: '2026-11-01',
  ...overrides,
});

const errorsFor = (members) => validateMembers({ members }, schema, { today }).errors;

describe('validateMembers', () => {
  it('accepts the sample data and the real data file', () => {
    assert.deepEqual(validateMembers(sample, schema, { today }).errors, []);
    const real = JSON.parse(readFileSync(new URL('../data/members.json', import.meta.url), 'utf8'));
    assert.deepEqual(validateMembers(real, schema).errors, []);
  });

  it('rejects unknown and missing fields', () => {
    const { major, ...withoutMajor } = member();
    assert.ok(major);
    assert.match(errorsFor([withoutMajor]).join(), /missing required field "major"/);
    assert.match(errorsFor([member({ email: 'a@b.c' })]).join(), /unknown field "email"/);
  });

  it('rejects ids that are not lowercase slugs', () => {
    for (const id of ['Ana', 'ana_ramirez', '-ana', 'ana--r', 'a']) {
      assert.notDeepEqual(errorsFor([member({ id })]), [], id);
    }
  });

  it('caps website length, which keeps redirect rules short', () => {
    assert.match(errorsFor([member({ website: `https://a.example/${'x'.repeat(200)}` })]).join(), /at most 200/);
  });

  it('rejects duplicate ids and duplicate websites', () => {
    assert.match(errorsFor([member(), member({ website: 'https://other.example/' })]).join(), /id is already used/);
    assert.match(
      errorsFor([member(), member({ id: 'ana-2', website: 'https://www.ana-ramirez.example/' })]).join(),
      /website is already listed/,
    );
  });

  it('rejects control and bidirectional characters in text', () => {
    assert.match(errorsFor([member({ name: "Ana\u202eRam\u00edrez" })]).join(), /bidirectional/);
    assert.match(errorsFor([member({ major: "Computer\u200bScience" })]).join(), /bidirectional/);
    assert.match(errorsFor([member({ name: ' Ana' })]).join(), /leading or trailing/);
  });

  it('rejects impossible or future dates and far-future grad years', () => {
    assert.match(errorsFor([member({ joined: '2026-02-31' })]).join(), /real date/);
    assert.match(errorsFor([member({ joined: '2027-01-01' })]).join(), /future/);
    assert.match(errorsFor([member({ gradYear: 2040 })]).join(), /2033 or earlier/);
  });
});

describe('websiteProblems', () => {
  it('accepts plain https sites, including paths', () => {
    assert.deepEqual(websiteProblems('https://someone.github.io/portfolio/'), []);
  });

  it('rejects unsafe or non-personal URLs', () => {
    const cases = {
      'http://site.example/': /https/,
      'https://user:pass@site.example/': /username/,
      'https://site.example/?ref=x': /query/,
      'https://site.example:8443/': /port/,
      'https://192.168.0.1/': /IP address/,
      'https://localhost/': /public domain/,
      'https://linktr.ee/someone': /own site/,
      'https://github.com/someone': /own site/,
      'javascript:alert(1)': /https/,
      'not a url': /valid URL/,
      'https://site.example': /exactly as https:\/\/site\.example\//,
      'https://site.example/a\nb': /exactly as/,
    };
    for (const [url, pattern] of Object.entries(cases)) {
      assert.match(websiteProblems(url).join(), pattern, url);
    }
  });
});

describe('diffMembers', () => {
  const a = member({ id: 'a', website: 'https://a.example/' });
  const b = member({ id: 'b', website: 'https://b.example/' });
  const c = member({ id: 'c', website: 'https://c.example/' });

  it('accepts appended members', () => {
    const diff = diffMembers([a, b], [a, b, c]);
    assert.deepEqual(diff.errors, []);
    assert.deepEqual(diff.added.map((m) => m.id), ['c']);
  });

  it('rejects members inserted before existing ones', () => {
    assert.match(diffMembers([a, b], [a, c, b]).errors.join(), /added at the end/);
  });

  it('rejects reordering existing members', () => {
    assert.match(diffMembers([a, b], [b, a]).errors.join(), /reordered/);
  });

  it('reports changes and removals, warning on bulk edits', () => {
    const diff = diffMembers([a, b, c], [{ ...a, major: 'Data Science' }, c]);
    assert.deepEqual(diff.changed.map((m) => m.id), ['a']);
    assert.deepEqual(diff.removed.map((m) => m.id), ['b']);
    assert.equal(diff.errors.length, 0);
    assert.equal(diff.warnings.length, 1);
  });
});
