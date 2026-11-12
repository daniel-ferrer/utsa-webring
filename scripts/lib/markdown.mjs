/**
 * Escape member-supplied text for a Markdown table cell, so it can't break the
 * table, inject formatting or links, or @-mention someone in an issue.
 */
export function mdCell(value) {
  return String(value)
    .replace(/[\r\n]+/g, ' ')
    .replace(/[\\`*_[\]<>|@#!~&]/g, '\\$&');
}
