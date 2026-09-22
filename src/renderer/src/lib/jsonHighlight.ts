import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

/**
 * Matches the app's neon JSON palette (see .json-* in theme.css).
 * Keys render with the rainbow gradient via .cm-rainbow-key.
 */
export const jsonHighlight = HighlightStyle.define([
  { tag: tags.propertyName, class: 'cm-rainbow-key' },
  { tag: tags.string, color: 'var(--text)' },
  { tag: tags.number, color: 'var(--text)' },
  { tag: tags.bool, color: 'var(--text)', fontWeight: '700' },
  { tag: tags.null, color: 'var(--text-faint)', fontStyle: 'italic' },
  { tag: tags.separator, color: 'var(--text-dim)' },
  { tag: tags.punctuation, color: 'var(--text-dim)' }
])

export const rainbowJsonTheme = syntaxHighlighting(jsonHighlight)