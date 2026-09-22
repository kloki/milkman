import { app } from 'electron'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { HistoryEntry, Settings } from '../shared/types'

interface StoreShape {
  settings: Settings
  history: HistoryEntry[]
}

const MAX_HISTORY = 50

const defaults: StoreShape = {
  settings: { apiKey: '', baseUrl: 'https://api.typesafe.ai' },
  history: []
}

let file: string
let cache: StoreShape | null = null

function load(): StoreShape {
  if (cache) return cache
  file = join(app.getPath('userData'), 'milkman-store.json')
  try {
    const raw = readFileSync(file, 'utf8')
    const parsed = JSON.parse(raw) as Partial<StoreShape>
    cache = {
      settings: { ...defaults.settings, ...parsed.settings },
      history: parsed.history ?? []
    }
  } catch {
    cache = { ...defaults, history: [] }
  }
  return cache
}

function persist(): void {
  const dir = dirname(file)
  mkdirSync(dir, { recursive: true })
  const tmp = file + '.tmp'
  writeFileSync(tmp, JSON.stringify(cache, null, 2), 'utf8')
  renameSync(tmp, file)
}

export function getStore(): StoreShape {
  return load()
}

export function getSettings(): Settings {
  const stored = load().settings
  const envKey = process.env.TYPESAFE_API_KEY
  if (!stored.apiKey && envKey) {
    return { ...stored, apiKey: envKey, apiKeyFromEnv: true }
  }
  return { ...stored, apiKeyFromEnv: false }
}

export function setSettings(settings: Settings): void {
  load().settings = settings
  persist()
}

export function listHistory(): HistoryEntry[] {
  return load().history
}

export function addHistory(entry: HistoryEntry): HistoryEntry[] {
  const store = load()
  store.history = [entry, ...store.history.filter((e) => e.id !== entry.id)].slice(0, MAX_HISTORY)
  persist()
  return store.history
}

export function removeHistory(id: string): HistoryEntry[] {
  const store = load()
  store.history = store.history.filter((e) => e.id !== id)
  persist()
  return store.history
}

export function clearHistory(): void {
  load().history = []
  persist()
}