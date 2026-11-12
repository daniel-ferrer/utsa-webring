import { SITE } from './config.mjs';
import { renderPapelPicado, renderTileStrip, renderWireframeRing } from './decor.mjs';
import { displayHost, initials, searchText } from './format.mjs';
import { escapeHtml, fillTemplate } from './html.mjs';
import { renderLoop } from './loop.mjs';

const SWATCH_COUNT = 4;

/**
 * Render every page. `templates` maps template names to their source and
 * `asset` turns a path under /assets into a cache-busted URL.
 * Returns a map of output path -> HTML.
 */
export function renderPages({ members, templates, asset, today }) {
  const page = (options) =>
    fillTemplate(templates.layout, {
      title: escapeHtml(options.title),
      description: escapeHtml(SITE.description),
      indexing: indexingTags(options.path),
      ogImage: escapeHtml(SITE.url + asset('img/og-image.png')),
      favicon: asset('img/favicon.svg'),
      stylesheet: asset('css/site.css'),
      scripts: (options.scripts ?? [])
        .map((name) => `<script type="module" src="${asset(`js/${name}`)}"></script>`)
        .join('\n  '),
      bodyClass: options.bodyClass ?? 'page',
      banner: options.banner ?? renderPapelPicado(),
      repoUrl: escapeHtml(SITE.repoUrl),
      disclaimer: escapeHtml(SITE.disclaimer),
      content: options.content,
    });

  return {
    'index.html': page({
      title: 'utsa-webring: a webring for UTSA students and alumni in tech',
      path: '/',
      scripts: ['home.js'],
      content: fillTemplate(templates.index, {
        loop: renderLoop(members),
        loopCaption: loopCaption(members),
        tileStrip: renderTileStrip(),
        yearOptions: yearOptions(members),
        memberList: memberList(members),
      }),
    }),
    'join/index.html': page({
      title: 'Join · utsa-webring',
      path: '/join/',
      scripts: ['join.js'],
      content: fillTemplate(templates.join, {
        repoUrl: escapeHtml(SITE.repoUrl),
        today: escapeHtml(today),
        memberOptions: memberOptions(members),
        linksTemplate: escapeHtml(linksSnippet('{id}')),
        linksSnippet: escapeHtml(linksSnippet('your-id')),
        badgeSnippet: escapeHtml(badgeSnippet()),
        badgeUrl: asset('img/badge-88x31.svg'),
      }),
    }),
    'random/index.html': page({
      title: 'Random hop · utsa-webring',
      path: '/random/',
      scripts: ['random.js'],
      content: templates.random,
    }),
    '404.html': page({
      title: 'Not found · utsa-webring',
      path: null,
      bodyClass: 'page page--night',
      banner: '',
      content: fillTemplate(templates.notFound, { wireframe: renderWireframeRing() }),
    }),
  };
}

/** Canonical URL tags for a page, or `noindex` for pages without one (the 404). */
function indexingTags(path) {
  if (path === null) return '<meta name="robots" content="noindex">';
  const url = escapeHtml(SITE.url + path);
  return `<link rel="canonical" href="${url}">\n  <meta property="og:url" content="${url}">`;
}

function loopCaption(members) {
  const newest = members.at(-1);
  if (!newest) return 'Each member links to the next. Yours could be the first.';
  return (
    'Each member links to the next; the last links back to the first. ' +
    `Newest in the loop: <a href="${escapeHtml(newest.website)}">${escapeHtml(newest.name)}</a>.`
  );
}

function memberList(members) {
  if (members.length === 0) {
    return '      <p class="members-empty">No sites yet. <a href="/join/">Be the first to join.</a></p>';
  }
  const items = members.map((member, index) => {
    const meta = [member.degree ? `${member.degree} ${member.major}` : member.major, `Class of ${member.gradYear}`];
    return [
      `        <li class="member" data-member data-year="${member.gradYear}" data-search="${escapeHtml(searchText(member))}">`,
      `          <a class="member-card" href="${escapeHtml(member.website)}">`,
      `            <span class="avatar swatch-${index % SWATCH_COUNT}" aria-hidden="true">${escapeHtml(initials(member.name))}</span>`,
      '            <span class="member-text">',
      `              <span class="member-name">${escapeHtml(member.name)}</span>`,
      `              <span class="member-host">${escapeHtml(displayHost(member.website))}</span>`,
      `              <span class="member-meta">${escapeHtml(meta.join(' · '))}</span>`,
      '            </span>',
      '          </a>',
      '        </li>',
    ].join('\n');
  });
  return ['      <ul class="member-list" data-member-list>', ...items, '      </ul>'].join('\n');
}

function yearOptions(members) {
  const years = [...new Set(members.map((member) => member.gradYear))].sort((a, b) => b - a);
  return years.map((year) => `              <option value="${year}">${year}</option>`).join('\n');
}

function memberOptions(members) {
  return [...members]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((member) => `              <option value="${escapeHtml(member.id)}">${escapeHtml(member.name)}</option>`)
    .join('\n');
}

export function linksSnippet(id) {
  return [
    '<nav aria-label="utsa-webring">',
    `  <a href="${SITE.url}/${id}/prev">← prev</a>`,
    `  <a href="${SITE.url}/">utsa-webring</a>`,
    `  <a href="${SITE.url}/${id}/next">next →</a>`,
    '</nav>',
  ].join('\n');
}

function badgeSnippet() {
  return [
    `<a href="${SITE.url}/">`,
    `  <img src="${SITE.url}/assets/img/badge-88x31.svg" width="88" height="31" alt="utsa-webring">`,
    '</a>',
  ].join('\n');
}
