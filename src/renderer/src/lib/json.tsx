import { useMemo } from 'react'

export interface JsonToken {
  text: string
  kind: 'punctuation' | 'key' | 'string' | 'number' | 'boolean' | 'null' | 'plain'
}

/** Tokenize compact/pretty JSON into spans for syntax highlighting. */
export function tokenizeJson(source: string): JsonToken[] {
  const tokens: JsonToken[] = []
  let i = 0
  const n = source.length
  const push = (text: string, kind: JsonToken['kind']) => {
    if (text) tokens.push({ text, kind })
  }

  while (i < n) {
    const ch = source[i]
    if (ch === '"') {
      let j = i + 1
      let escaped = false
      while (j < n) {
        const c = source[j]
        if (escaped) {
          escaped = false
        } else if (c === '\\') {
          escaped = true
        } else if (c === '"') {
          j++
          break
        }
        j++
      }
      let k = j
      while (k < n && /\s/.test(source[k])) k++
      push(source.slice(i, j), source[k] === ':' ? 'key' : 'string')
      i = j
    } else if (ch === '{' || ch === '}' || ch === '[' || ch === ']' || ch === ':' || ch === ',') {
      push(ch, 'punctuation')
      i++
    } else if (/[0-9\-]/.test(ch)) {
      let j = i
      while (j < n && /[0-9eE+\-.]/.test(source[j])) j++
      push(source.slice(i, j), 'number')
      i = j
    } else if (/[a-zA-Z_]/.test(ch)) {
      let j = i
      while (j < n && /[a-zA-Z_]/.test(source[j])) j++
      const word = source.slice(i, j)
      push(word, word === 'true' || word === 'false' ? 'boolean' : word === 'null' ? 'null' : 'plain')
      i = j
    } else {
      let j = i
      while (j < n && !isBoundary(source[j])) j++
      push(source.slice(i, j), 'plain')
      i = j
    }
  }
  return tokens
}

function isBoundary(ch: string): boolean {
  return (
    ch === '"' ||
    ch === '{' ||
    ch === '}' ||
    ch === '[' ||
    ch === ']' ||
    ch === ':' ||
    ch === ',' ||
    /[0-9\-]/.test(ch) ||
    /[a-zA-Z_]/.test(ch)
  )
}

export function JsonSyntax({ source, className }: { source: string; className?: string }) {
  const tokens = useMemo(() => tokenizeJson(source), [source])
  return (
    <pre className={`json-syntax ${className ?? ''}`}>
      {tokens.map((t, idx) => (
        <span key={idx} className={`json-${t.kind}`}>
          {t.text}
        </span>
      ))}
    </pre>
  )
}

export function prettyPrintJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}