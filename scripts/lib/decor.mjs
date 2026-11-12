/**
 * Decorative SVG: the papel picado banner and the tile divider. Colors come
 * from CSS classes so both themes work; cut-outs are real holes (even-odd
 * fill) so the page background shows through.
 */

const FLAG_COUNT = 24;
const FLAG_WIDTH = 78;
const FLAG_GAP = 10;
const FLAG_COLORS = 5;

const FLAG_PATH = [
  // Scalloped flag outline.
  'M0 0H78V62L71.5 74L65 62L58.5 74L52 62L45.5 74L39 62L32.5 74L26 62L19.5 74L13 62L6.5 74L0 62Z',
  // Cut-outs: a center circle, four petals and four corner dots.
  'M30 28a9 9 0 1 0 18 0a9 9 0 1 0-18 0Z',
  'M39 8L43 18L39 15L35 18Z',
  'M39 48L43 38L39 41L35 38Z',
  'M14 28L23 24L21 28L23 32Z',
  'M64 28L55 24L57 28L55 32Z',
  'M9 10a3 3 0 1 0 6 0a3 3 0 1 0-6 0Z',
  'M63 10a3 3 0 1 0 6 0a3 3 0 1 0-6 0Z',
  'M9 50a3 3 0 1 0 6 0a3 3 0 1 0-6 0Z',
  'M63 50a3 3 0 1 0 6 0a3 3 0 1 0-6 0Z',
].join('');

export function renderPapelPicado() {
  const width = FLAG_COUNT * (FLAG_WIDTH + FLAG_GAP);
  const flags = Array.from(
    { length: FLAG_COUNT },
    (_, i) =>
      `<use href="#picado-flag" class="picado-flag swatch-${i % FLAG_COLORS}" x="${i * (FLAG_WIDTH + FLAG_GAP) + FLAG_GAP / 2}" y="12" width="${FLAG_WIDTH}" height="74"/>`,
  );
  return [
    `<svg class="picado" viewBox="0 0 ${width} 92" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">`,
    `<defs><symbol id="picado-flag" viewBox="0 0 78 74"><path fill-rule="evenodd" d="${FLAG_PATH}"/></symbol></defs>`,
    `<line class="picado-string" x1="0" y1="12" x2="${width}" y2="12"/>`,
    ...flags,
    '</svg>',
  ].join('\n');
}

export function renderTileStrip() {
  return [
    '<svg class="tile-strip" width="100%" height="36" aria-hidden="true" focusable="false">',
    '<defs><pattern id="tile" width="36" height="36" patternUnits="userSpaceOnUse">',
    '<rect class="tile-ground" width="36" height="36"/>',
    '<path class="tile-star" d="M18 3L23 13L33 18L23 23L18 33L13 23L3 18L13 13Z"/>',
    '<circle class="tile-center" cx="18" cy="18" r="4"/>',
    '<circle class="tile-corner" cx="0" cy="0" r="5"/><circle class="tile-corner" cx="36" cy="0" r="5"/>',
    '<circle class="tile-corner" cx="0" cy="36" r="5"/><circle class="tile-corner" cx="36" cy="36" r="5"/>',
    '</pattern></defs>',
    '<rect width="100%" height="36" fill="url(#tile)"/>',
    '</svg>',
  ].join('\n');
}

/** The wireframe ring from the original SE Webring style, used on the 404 page. */
export function renderWireframeRing() {
  const meridians = [
    [455, 200, 65, 0.55], [434.2, 227, 57.6, 0.55], [377.5, 246.8, 37.5, 0.55], [300, 254, 10, 0.55],
    [222.5, 246.8, 37.5, 0.55], [165.8, 227, 57.6, 0.55], [145, 200, 65, 0.55], [165.8, 173, 57.6, 0.3],
    [222.5, 153.2, 37.5, 0.3], [300, 146, 10, 0.3], [377.5, 153.2, 37.5, 0.3], [434.2, 173, 57.6, 0.3],
  ];
  return [
    '<svg class="wireframe" viewBox="0 0 600 400" aria-hidden="true" focusable="false">',
    '<g class="wireframe-lines">',
    '<ellipse cx="300" cy="200" rx="220" ry="116"/>',
    '<ellipse cx="300" cy="200" rx="90" ry="20"/>',
    '<ellipse class="wireframe-dashed" cx="300" cy="200" rx="155" ry="54"/>',
    ...meridians.map(([cx, cy, rx, opacity]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="62" opacity="${opacity}"/>`),
    '</g>',
    '</svg>',
  ].join('\n');
}
