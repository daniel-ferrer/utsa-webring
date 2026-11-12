import { SITE } from './config.mjs';

const USER_AGENT = `Mozilla/5.0 (compatible; utsa-webring-link-check; +${SITE.url})`;
const TIMEOUT_MS = 15_000;
const MAX_BODY_BYTES = 2_000_000;

/** Statuses that mean "the site exists but turned the checker away", not "dead". */
const BLOCKED_STATUSES = new Set([401, 403, 429]);

/**
 * Fetch a member site and classify it. Never throws.
 * Returns `{ ok, status, finalUrl, error, body }`; `body` is only read when
 * `readBody` is true (used to look for a link back to the ring).
 */
export async function probe(url, { readBody = false, retries = 2 } = {}) {
  let last;
  for (let attempt = 0; attempt <= retries; attempt++) {
    last = await probeOnce(url, readBody);
    if (last.ok) return last;
    if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, 2_000 * (attempt + 1)));
  }
  return last;
}

async function probeOnce(url, readBody) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8' },
    });
    const ok = response.ok || BLOCKED_STATUSES.has(response.status);
    const shouldRead = readBody && response.ok;
    const body = shouldRead ? await readLimited(response) : '';
    if (!shouldRead) await response.body?.cancel();
    return { ok, status: response.status, finalUrl: response.url, error: null, body };
  } catch (error) {
    return { ok: false, status: null, finalUrl: null, error: error.cause?.code ?? error.name, body: '' };
  }
}

async function readLimited(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let received = 0;
  while (received < MAX_BODY_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    text += decoder.decode(value, { stream: true });
  }
  await reader.cancel();
  return text;
}

/** Run `task` over `items` with at most `limit` in flight. */
export async function mapConcurrent(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Whether a page's HTML links back to the ring. */
export function linksBack(html) {
  const host = new URL(SITE.url).hostname.replace(/\./g, '\\.');
  return new RegExp(`href\\s*=\\s*["']?https?://(www\\.)?${host}(?=[/"'\\s>?#]|$)`, 'i').test(html);
}

export function describe(result) {
  if (result.status) return `HTTP ${result.status}`;
  return result.error ?? 'unreachable';
}
