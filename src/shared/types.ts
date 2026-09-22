export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type QuestionType = 'noul' | 'choice' | 'score'

export interface NoulQuestion {
  type: 'noul'
  instructions: JsonValue
  criteria?: { true?: JsonValue; false?: JsonValue }
}

export interface ChoiceQuestion {
  type: 'choice'
  instructions: JsonValue
  criteria: Record<string, JsonValue>
}

export interface ScoreQuestion {
  type: 'score'
  instructions: JsonValue
  criteria: JsonValue[]
}

export type Question = NoulQuestion | ChoiceQuestion | ScoreQuestion
export type Questions = Record<string, Question>

export interface SystemOneRequest {
  state: JsonValue
  model: string
  questions: Questions
}

export interface NoulAnswer {
  type: 'noul'
  noul: number
}

export interface ChoiceAnswer {
  type: 'choice'
  choice: string
  probabilities: Record<string, number>
  confidence: number
}

export interface ScoreAnswer {
  type: 'score'
  score: number
  legend: Record<string, string>
  probabilities: Record<string, number>
  confidence: number
}

export type Answer = NoulAnswer | ChoiceAnswer | ScoreAnswer

export interface SystemOneResponse {
  model: string
  answers: Record<string, Answer>
  usage: { input_tokens: number; output_tokens: number }
}

export interface ModelInfo {
  name: string
  description: string
  release_date: string
}

export interface ApiResult {
  ok: boolean
  status: number
  statusText: string
  durationMs: number
  /** Parsed JSON body when the response was JSON. */
  body: JsonValue | null
  /** Raw body text, always present. */
  rawBody: string
  /** Transport error message (e.g. network failure). */
  error?: string
}

export interface Settings {
  apiKey: string
  baseUrl: string
  /** True when the effective key came from TYPESAFE_API_KEY, not the store. */
  apiKeyFromEnv?: boolean
}

export interface HistoryEntry {
  id: string
  ts: number
  name: string
  request: SystemOneRequest
  response: ApiResult | null
}

export interface ModelsResult {
  ok: boolean
  models?: ModelInfo[]
  error?: string
}

export interface MilkmanApi {
  sendSystemOne: (apiKey: string, baseUrl: string, request: SystemOneRequest) => Promise<ApiResult>
  listModels: (apiKey: string, baseUrl: string) => Promise<ModelsResult>
  getSettings: () => Promise<Settings>
  setSettings: (settings: Settings) => Promise<void>
  listHistory: () => Promise<HistoryEntry[]>
  addHistory: (entry: HistoryEntry) => Promise<HistoryEntry[]>
  removeHistory: (id: string) => Promise<HistoryEntry[]>
  clearHistory: () => Promise<void>
}