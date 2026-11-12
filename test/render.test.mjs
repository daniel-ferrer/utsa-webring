import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { displayHost, initials, normalizeText } from '../scripts/lib/format.mjs';
import { escapeHtml, fillTemplate } from '../scripts/lib/html.mjs';
import { layoutLoop, renderLoop } from '../scripts/lib/loop.mjs';
import { mdCell } from '../scripts/lib/markdown.mjs';
import { linksBack } from '../scripts/lib/probe.mjs';
import { redirectRules, ringNeighbors } from '../scripts/lib/ring.mjs';

const members = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `m-${i}`,
    name: `Member ${i}`,
    website: `https://m-${i}.example/`,
  }));

describe('html helpers', () => {
  it('escapes markup and quotes', () => {
    assert.equal(escapeHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });

  it('fills slots once and throws on missing ones', () => {
    assert.equal(fillTemplate('{{a}} {{ b }}', { a: '{{b}}', b: '$&' }), '{{b}} $&');
    assert.throws(() => fillTemplate('{{missing}}', {}), /missing/);
  });

  it('escapes member text in Markdown cells', () => {
    assert.equal(mdCell('a|b @user [x](y)'), 'a\\|b \\@user \\[x\\](y)');
    assert.equal(mdCell('&#64;user'), '\\&\\#64;user');
  });

  it('detects links back to the ring', () => {
    assert.ok(linksBack('<a href="https://utsa-webring.com/ana/next">next</a>'));
    assert.ok(linksBack("<a href='https://www.utsa-webring.com/'>ring</a>"));
    assert.ok(!linksBack('<p>utsa-webring.com</p>'));
    assert.ok(!linksBack('<a href="https://utsa-webring.com.evil.example/">x</a>'));
  });
});

describe('format helpers', () => {
  it('normalizes accents for search', () => {
    assert.equal(normalizeText('  Ana RAMÍREZ '), 'ana ramirez');
  });

  it('shows host and path without www', () => {
    assert.equal(displayHost('https://www.ana.example/'), 'ana.example');
    assert.equal(displayHost('https://someone.github.io/portfolio/'), 'someone.github.io/portfolio');
  });

  it('takes initials from the first and last words', () => {
    assert.equal(initials('Ana María Ramírez'), 'AR');
    assert.equal(initials('Prince'), 'P');
    assert.equal(initials('élise ñuñez'), 'ÉÑ');
  });
});

describe('ring', () => {
  it('wraps around at both ends', () => {
    const ring = ringNeighbors(members(3));
    assert.equal(ring[0].prev.id, 'm-2');
    assert.equal(ring[2].next.id, 'm-0');
  });

  it('links a lone member to itself', () => {
    const [only] = ringNeighbors(members(1));
    assert.equal(only.next.id, 'm-0');
    assert.equal(only.prev.id, 'm-0');
  });

  it('writes member rules before the fallbacks', () => {
    const { lines, staticCount } = redirectRules(members(2));
    assert.equal(staticCount, 4);
    assert.equal(lines[0], '/m-0/next https://m-1.example/ 302');
    assert.equal(lines.at(-1), '/:id/prev / 302');
  });
});

describe('living loop', () => {
  it('uses the right shape for each size', () => {
    assert.equal(layoutLoop(0).nodes.length, 0);
    assert.equal(layoutLoop(9).showInitials, true);
    assert.equal(layoutLoop(40).showInitials, false);
    assert.equal(layoutLoop(40).shape, 'circle');
    assert.equal(layoutLoop(150).shape, 'coil');
  });

  it('places every node inside the view box without NaNs', () => {
    for (const count of [1, 2, 24, 25, 90, 91, 300, 1000]) {
      const { nodes } = layoutLoop(count);
      assert.equal(nodes.length, count);
      for (const { x, y } of nodes) {
        assert.ok(Number.isFinite(x) && Number.isFinite(y), `count ${count}`);
        assert.ok(x >= 0 && x <= 400 && y >= 0 && y <= 400, `count ${count}`);
      }
    }
  });

  it('keeps coil nodes from overlapping', () => {
    const { nodes, nodeRadius } = layoutLoop(200);
    for (let i = 1; i < nodes.length; i++) {
      const gap = Math.hypot(nodes[i].x - nodes[i - 1].x, nodes[i].y - nodes[i - 1].y);
      assert.ok(gap >= nodeRadius * 2, `nodes ${i - 1} and ${i} overlap`);
    }
  });

  it('escapes member data and marks the newest member', () => {
    const svg = renderLoop([{ id: 'x', name: '<b>Eve</b>', website: 'https://eve.example/' }]);
    assert.ok(!svg.includes('<b>'));
    assert.match(svg, /is-newest/);
    assert.match(svg, />1<\/text>/);
  });
});
