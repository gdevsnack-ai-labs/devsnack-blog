const HTML_ENTITY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/&nbsp;/gi, ' '],
  [/&quot;/gi, '"'],
  [/&#39;|&apos;/gi, "'"],
  [/&lt;/gi, '<'],
  [/&gt;/gi, '>'],
  [/&amp;/gi, '&'],
]

function decodeHtmlEntities(value: string): string {
  return HTML_ENTITY_REPLACEMENTS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
}

/** Convert imported/card summary content into safe, visible plain text. */
export function toPlainTextExcerpt(value: string | null | undefined, fallback = ''): string {
  let text = String(value || '')

  // Decode twice so an encoded tag such as &amp;lt;p&amp;gt; cannot cross the
  // projection boundary as visible markup.
  for (let pass = 0; pass < 2; pass += 1) {
    const decoded = decodeHtmlEntities(text)
    text = decoded
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/?[a-z][^>]*>/gi, ' ')
  }

  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized || fallback
}
