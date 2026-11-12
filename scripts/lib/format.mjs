/** Display helpers shared by the build and the client-side search. */

/** Lowercase and strip diacritics so "Ramírez" matches "ramirez". */
export function normalizeText(text) {
  return String(text)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/** Hostname without "www.", plus the path when the site lives below the root. */
export function displayHost(website) {
  const url = new URL(website);
  const host = url.hostname.replace(/^www\./, '');
  const path = url.pathname.replace(/\/+$/, '');
  return host + path;
}

/** Up to two initials from the first and last words of a name. */
export function initials(name) {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return '';
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words.at(-1))[0] : '';
  return (first + last).toUpperCase();
}

/** Text the client-side filter searches: name, site, major, degree and year. */
export function searchText(member) {
  return normalizeText(
    [member.name, displayHost(member.website), member.major, member.degree ?? '', member.gradYear].join(' '),
  );
}
