import { describe, expect, it } from 'vitest'
import {
  bestEffortRequest,
  buildRequest,
  coerceStructured,
  emptyDraft,
  emptyQuestion,
  parseState,
  requestToDraft
} from '../src/renderer/src/lib/request'

describe('parseState', () => {
  it('keeps plain text as a string', () => {
    expect(parseState('hello world')).toBe('hello world')
  })
  it('parses object literals as JSON', () => {
    expect(parseState('{ "a": 1 }')).toEqual({ a: 1 })
  })
  it('parses array literals as JSON', () => {
    expect(parseState('["a", "b"]')).toEqual(['a', 'b'])
  })
  it('returns null for invalid JSON-looking state', () => {
    expect(parseState('{ not json }')).toBeNull()
  })
})

describe('coerceStructured', () => {
  it('keeps plain strings', () => {
    expect(coerceStructured('Which team?')).toBe('Which team?')
  })
  it('parses object/array literals', () => {
    expect(coerceStructured('{ "q": "is this?", "data": 1 }')).toEqual({ q: 'is this?', data: 1 })
    expect(coerceStructured('["a"]')).toEqual(['a'])
  })
  it('falls back to the string when a brace literal does not parse', () => {
    expect(coerceStructured('{ broken }')).toBe('{ broken }')
  })
})

function draftWithQuestions(overrides: Record<string, unknown> = {}) {
  const d = emptyDraft()
  d.state = 'Help! Stripe is failing.'
  d.model = 'jev-latest'
  d.questions = [
    {
      ...emptyQuestion('choice'),
      id: 'department',
      instructions: 'Which team?',
      choiceOptions: [
        { option: 'billing', description: 'payments' },
        { option: 'technical', description: 'bugs' }
      ]
    }
  ]
  return { ...d, ...overrides }
}

describe('buildRequest', () => {
  it('builds a valid mixed request', () => {
    const d = emptyDraft()
    d.state = 'Hello!'
    d.model = 'jev-latest'
    d.questions = [
      {
        ...emptyQuestion('noul'),
        id: 'urgent',
        instructions: 'Is this urgent?',
        noulTrue: 'time-sensitive',
        noulFalse: 'no urgency'
      },
      {
        ...emptyQuestion('score'),
        id: 'frustration',
        instructions: 'How frustrated?',
        scoreLevels: ['Calm', 'Angry', 'Furious']
      }
    ]
    const res = buildRequest(d)
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.request.state).toBe('Hello!')
    expect(res.request.questions.urgent).toEqual({
      type: 'noul',
      instructions: 'Is this urgent?',
      criteria: { true: 'time-sensitive', false: 'no urgency' }
    })
    expect(res.request.questions.frustration).toEqual({
      type: 'score',
      instructions: 'How frustrated?',
      criteria: ['Calm', 'Angry', 'Furious']
    })
  })

  it('omits empty noul criteria', () => {
    const d = draftWithQuestions()
    d.questions = [{ ...emptyQuestion('noul'), id: 'u', instructions: 'urgent?' }]
    const res = buildRequest(d)
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.request.questions.u).toEqual({ type: 'noul', instructions: 'urgent?' })
  })

  it('rejects empty state', () => {
    const res = buildRequest(draftWithQuestions({ state: '' }))
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.errors.some((e) => e.path === 'state')).toBe(true)
  })

  it('rejects malformed JSON state', () => {
    const res = buildRequest(draftWithQuestions({ state: '{ nope }' }))
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.errors.some((e) => e.path === 'state')).toBe(true)
  })

  it('rejects empty model', () => {
    const res = buildRequest(draftWithQuestions({ model: '  ' }))
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.errors.some((e) => e.path === 'model')).toBe(true)
  })

  it('rejects duplicate question ids', () => {
    const d = draftWithQuestions()
    d.questions.push({ ...emptyQuestion('noul'), id: 'department', instructions: 'x' })
    const res = buildRequest(d)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.errors.some((e) => e.message.includes('Duplicate'))).toBe(true)
  })

  it('rejects a choice with no options', () => {
    const d = draftWithQuestions()
    d.questions = [{ ...emptyQuestion('choice'), id: 'c', instructions: 'pick', choiceOptions: [{ option: '', description: '' }] }]
    const res = buildRequest(d)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.errors.some((e) => e.path.endsWith('criteria'))).toBe(true)
  })

  it('rejects a score with fewer than 2 levels', () => {
    const d = draftWithQuestions()
    d.questions = [{ ...emptyQuestion('score'), id: 's', instructions: 'rate', scoreLevels: ['only one'] }]
    const res = buildRequest(d)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.errors.some((e) => e.message.includes('at least 2'))).toBe(true)
  })

  it('rejects missing instructions', () => {
    const d = draftWithQuestions()
    d.questions = [{ ...emptyQuestion('noul'), id: 'u', instructions: '  ' }]
    const res = buildRequest(d)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.errors.some((e) => e.path.endsWith('instructions'))).toBe(true)
  })
})

describe('requestToDraft round-trip', () => {
  it('converts a wire request back into a draft', () => {
    const d = draftWithQuestions()
    const built = buildRequest(d)
    if (!built.ok) throw new Error('draft should be valid')
    const back = requestToDraft(built.request, 'name')
    expect(back.name).toBe('name')
    expect(back.model).toBe('jev-latest')
    expect(back.questions[0].id).toBe('department')
    expect(back.questions[0].choiceOptions[0]).toEqual({ option: 'billing', description: 'payments' })
  })

  it('flattens structured instructions to JSON text', () => {
    const built = buildRequest(
      draftWithQuestions({
        questions: [
          {
            ...emptyQuestion('noul'),
            id: 'u',
            instructions: JSON.stringify({ q: 'is this?', ref: 'backtick field' })
          }
        ]
      })
    )
    if (!built.ok) throw new Error('should be valid')
    const back = requestToDraft(built.request)
    expect(back.questions[0].instructions).toContain('"q": "is this?"')
  })
})

describe('bestEffortRequest', () => {
  it('serializes an incomplete draft without throwing', () => {
    const d = emptyDraft()
    const out = bestEffortRequest(d)
    expect(typeof out.state).toBe('string')
    expect(out.questions).toEqual({})
  })
})