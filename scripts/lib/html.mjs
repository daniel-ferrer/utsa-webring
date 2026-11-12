const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape a value for use in HTML text or a quoted attribute. */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/**
 * Replace `{{slot}}` placeholders in a template. Values are inserted verbatim,
 * so callers must escape untrusted text first. Missing slots throw rather than
 * silently rendering an empty string.
 */
export function fillTemplate(template, slots) {
  return template.replace(/\{\{\s*([A-Za-z]\w*)\s*\}\}/g, (_, key) => {
    if (!Object.hasOwn(slots, key)) {
      throw new Error(`Template slot "${key}" has no value`);
    }
    return String(slots[key]);
  });
}

/** Format a number for SVG coordinates: one decimal place, no trailing ".0". */
export function num(value) {
  return String(Math.round(value * 10) / 10);
}
