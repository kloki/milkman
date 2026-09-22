import type { ApiResult, ModelsResult, SystemOneRequest } from '../shared/types'

const DEFAULT_BASE_URL = 'https://api.typesafe.ai'

function normalizeBaseUrl(baseUrl: string): string {
  const url = (baseUrl || DEFAULT_BASE_URL).trim().replace(/\/+$/, '')
  return url || DEFAULT_BASE_URL
}

export async function sendSystemOne(
  apiKey: string,
  baseUrl: string,
  request: SystemOneRequest
): Promise<ApiResult> {
  const started = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120_000)

  try {
    const res = await fetch(`${normalizeBaseUrl(baseUrl)}/v1/systemone`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      signal: controller.signal
    })

    const rawBody = await res.text()
    let body: ApiResult['body'] = null
    try {
      body = JSON.parse(rawBody)
    } catch {
      body = null
    }

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      durationMs: Date.now() - started,
      body,
      rawBody
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      durationMs: Date.now() - started,
      body: null,
      rawBody: '',
      error: err instanceof Error ? (err.name === 'AbortError' ? 'Request timed out' : err.message) : String(err)
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function listModels(apiKey: string, baseUrl: string): Promise<ModelsResult> {
  try {
    const res = await fetch(`${normalizeBaseUrl(baseUrl)}/v1/models`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    const data = (await res.json()) as { models?: Array<{ name: string; description: string; release_date: string }> }
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${JSON.stringify(data)}` }
    }
    return { ok: true, models: data.models ?? [] }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}