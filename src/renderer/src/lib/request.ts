import type { JsonValue, Question, QuestionType, SystemOneRequest } from '../../../shared/types'

export interface DraftOption {
  option: string
  description: string
}

export interface DraftQuestion {
  id: string
  type: QuestionType
  instructions: string
  noulTrue: string
  noulFalse: string
  choiceOptions: DraftOption[]
  scoreLevels: string[]
}

export interface DraftRequest {
  name: string
  state: string
  model: string
  questions: DraftQuestion[]
}

export interface ValidationIssue {
  path: string
  message: string
}

export type BuildResult =
  | { ok: true; request: SystemOneRequest }
  | { ok: false; errors: ValidationIssue[] }

export const DEFAULT_MODEL = 'jev-latest'
const MAX_CHOICE_OPTIONS = 255
const MAX_SCORE_LEVELS = 10
const MIN_SCORE_LEVELS = 2

export function emptyDraft(): DraftRequest {
  return { name: '', state: '', model: DEFAULT_MODEL, questions: [] }
}

export function emptyQuestion(type: QuestionType = 'noul'): DraftQuestion {
  return {
    id: '',
    type,
    instructions: '',
    noulTrue: '',
    noulFalse: '',
    choiceOptions: [{ option: '', description: '' }],
    scoreLevels: ['', '']
  }
}

/** If the trimmed text is an object or array literal, parse it; else keep as string. */
export function coerceStructured(text: string): JsonValue {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as JsonValue
    } catch {
      return trimmed
    }
  }
  return trimmed
}

/** Parse the raw state field: object/array literals become JSON, everything else is a string. */
export function parseState(raw: string): JsonValue | null {
  const trimmed = raw.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as JsonValue
    } catch {
      return null
    }
  }
  return trimmed
}

export function buildRequest(draft: DraftRequest): BuildResult {
  const errors: ValidationIssue[] = []

  if (!draft.state.trim()) {
    errors.push({ path: 'state', message: 'State is required' })
  } else if (parseState(draft.state) === null) {
    errors.push({ path: 'state', message: 'State looks like JSON but does not parse' })
  }

  if (!draft.model.trim()) {
    errors.push({ path: 'model', message: 'Model is required' })
  }

  if (draft.questions.length === 0) {
    errors.push({ path: 'questions', message: 'Add at least one question' })
  }

  const seenIds = new Set<string>()
  const questions: SystemOneRequest['questions'] = {}

  draft.questions.forEach((q, qi) => {
    const base = `questions[${qi}]`
    const id = q.id.trim()
    if (!id) {
      errors.push({ path: `${base}.id`, message: 'Question id is required' })
      return
    }
    if (seenIds.has(id)) {
      errors.push({ path: `${base}.id`, message: `Duplicate question id "${id}"` })
      return
    }
    seenIds.add(id)

    if (!q.instructions.trim()) {
      errors.push({ path: `${base}.instructions`, message: 'Instructions are required' })
    }
    const instructions = coerceStructured(q.instructions)

    if (q.type === 'noul') {
      const question: Question = { type: 'noul', instructions }
      const criteria: { true?: JsonValue; false?: JsonValue } = {}
      if (q.noulTrue.trim()) criteria.true = coerceStructured(q.noulTrue)
      if (q.noulFalse.trim()) criteria.false = coerceStructured(q.noulFalse)
      if (criteria.true !== undefined || criteria.false !== undefined) question.criteria = criteria
      questions[id] = question
    } else if (q.type === 'choice') {
      const criteria: Record<string, JsonValue> = {}
      const valid = q.choiceOptions.filter((o) => o.option.trim())
      if (valid.length === 0) {
        errors.push({ path: `${base}.criteria`, message: 'Choice needs at least one option' })
      } else if (valid.length > MAX_CHOICE_OPTIONS) {
        errors.push({ path: `${base}.criteria`, message: `Choice supports at most ${MAX_CHOICE_OPTIONS} options` })
      } else {
        for (const o of valid) {
          criteria[o.option.trim()] = o.description.trim() ? coerceStructured(o.description) : null
        }
      }
      questions[id] = { type: 'choice', instructions, criteria }
    } else {
      const levels = q.scoreLevels.map((l) => l.trim()).filter((l) => l.length > 0)
      if (levels.length < MIN_SCORE_LEVELS) {
        errors.push({ path: `${base}.criteria`, message: `Score needs at least ${MIN_SCORE_LEVELS} levels` })
      } else if (levels.length > MAX_SCORE_LEVELS) {
        errors.push({ path: `${base}.criteria`, message: `Score supports at most ${MAX_SCORE_LEVELS} levels` })
      }
      questions[id] = { type: 'score', instructions, criteria: levels.map(coerceStructured) }
    }
  })

  if (errors.length > 0) return { ok: false, errors }
  return {
    ok: true,
    request: { state: parseState(draft.state) as JsonValue, model: draft.model.trim(), questions }
  }
}

/** Wire request → draft for the builder (best effort; instructions are flattened to text). */
export function requestToDraft(request: SystemOneRequest, name = ''): DraftRequest {
  const questions: DraftQuestion[] = Object.entries(request.questions).map(([id, q]) => {
    const base: DraftQuestion = {
      id,
      type: q.type,
      instructions: stringifyValue(q.instructions),
      noulTrue: '',
      noulFalse: '',
      choiceOptions: [],
      scoreLevels: []
    }
    if (q.type === 'noul') {
      base.noulTrue = stringifyValue(q.criteria?.true)
      base.noulFalse = stringifyValue(q.criteria?.false)
    } else if (q.type === 'choice') {
      base.choiceOptions = Object.entries(q.criteria).map(([option, description]) => ({
        option,
        description: stringifyValue(description)
      }))
      if (base.choiceOptions.length === 0) base.choiceOptions = [{ option: '', description: '' }]
    } else {
      base.scoreLevels = q.criteria.map(stringifyValue)
      if (base.scoreLevels.length < MIN_SCORE_LEVELS) base.scoreLevels = ['', '']
    }
    return base
  })
  return {
    name,
    state: stringifyValue(request.state),
    model: request.model,
    questions
  }
}

export function stringifyValue(value: JsonValue | undefined | null): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

export function draftToRequestJson(draft: DraftRequest): string {
  const built = buildRequest(draft)
  return JSON.stringify(built.ok ? built.request : bestEffortRequest(draft), null, 2)
}

/** Serialize whatever is currently in the builder, even if it isn't wire-valid yet. */
export function bestEffortRequest(draft: DraftRequest): SystemOneRequest {
  const questions: SystemOneRequest['questions'] = {}
  for (const q of draft.questions) {
    const instructions = coerceStructured(q.instructions)
    if (q.type === 'noul') {
      const question: Question = { type: 'noul', instructions }
      const criteria: { true?: JsonValue; false?: JsonValue } = {}
      if (q.noulTrue.trim()) criteria.true = coerceStructured(q.noulTrue)
      if (q.noulFalse.trim()) criteria.false = coerceStructured(q.noulFalse)
      if (criteria.true !== undefined || criteria.false !== undefined) question.criteria = criteria
      questions[q.id] = question
    } else if (q.type === 'choice') {
      const criteria: Record<string, JsonValue> = {}
      for (const o of q.choiceOptions) {
        if (o.option.trim()) criteria[o.option.trim()] = o.description.trim() ? coerceStructured(o.description) : null
      }
      questions[q.id] = { type: 'choice', instructions, criteria }
    } else {
      questions[q.id] = {
        type: 'score',
        instructions,
        criteria: q.scoreLevels.map((l) => l.trim()).filter((l) => l).map(coerceStructured)
      }
    }
  }
  return { state: parseState(draft.state) ?? draft.state, model: draft.model, questions }
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

export function formatTokens(n: number): string {
  return n.toLocaleString('en-US')
}