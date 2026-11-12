/**
 * Ring order is array order. Each member links to the next one, and the last
 * member wraps around to the first.
 */
export function ringNeighbors(members) {
  const count = members.length;
  return members.map((member, index) => ({
    member,
    prev: members[(index - 1 + count) % count],
    next: members[(index + 1) % count],
  }));
}

/**
 * Lines for Cloudflare Pages' _redirects file. Specific member rules come
 * first; the placeholder rules after them normalize trailing slashes and send
 * unknown or removed ids back to the homepage instead of a 404.
 */
export function redirectRules(members) {
  const rules = [];
  for (const { member, prev, next } of ringNeighbors(members)) {
    rules.push(`/${member.id}/next ${new URL(next.website).href} 302`);
    rules.push(`/${member.id}/prev ${new URL(prev.website).href} 302`);
  }
  return {
    staticCount: rules.length,
    lines: [
      ...rules,
      '/:id/next/ /:id/next 301',
      '/:id/prev/ /:id/prev 301',
      '/:id/next / 302',
      '/:id/prev / 302',
    ],
  };
}
