/**
 * HTML formatters - escape and sanitize HTML strings
 */

/**
 * Escape HTML to prevent XSS
 */
export function escape_html(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
