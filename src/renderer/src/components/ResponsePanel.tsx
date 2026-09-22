import { useEffect, useMemo, useState } from 'react'
import { StatCounter } from 'performative-ui'
import type { ApiResult, SystemOneResponse } from '../../../shared/types'
import { formatDuration, formatTokens } from '../lib/request'
import { JsonSyntax, prettyPrintJson } from '../lib/json'
import { AnswerCard } from './AnswerCard'
import { EmptyState, Evaluating, Segmented, statusTone } from './ui'

export type ResponseMode = 'formatted' | 'json'

interface ResponsePanelProps {
  response: ApiResult | null
  loading: boolean
  mode: ResponseMode
  onModeChange: (mode: ResponseMode) => void
}

export function isSystemOneResponse(body: unknown): body is SystemOneResponse {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return typeof b.model === 'string' && typeof b.answers === 'object' && b.answers !== null
}

export function ResponsePanel({ response, loading, mode, onModeChange }: ResponsePanelProps) {
  const parsed = useMemo(() => {
    if (!response?.rawBody) return null
    try {
      return JSON.parse(response.rawBody) as unknown
    } catch {
      return null
    }
  }, [response?.rawBody])

  const isResp = response !== null && response.ok && isSystemOneResponse(parsed)
  const showJson = response !== null && (mode === 'json' || !isResp)
  const pretty = response ? prettyPrintJson(response.rawBody) : ''

  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">Response</span>
        {showJson && pretty && <CopyButton text={pretty} />}
        <Segmented options={MODES} value={mode} onChange={onModeChange} />
      </div>

      <div className="panel-body">
        {loading && (
          <EmptyState>
            <Evaluating />
          </EmptyState>
        )}

        {!loading && !response && (
          <EmptyState>
            <span>Nothing here yet.</span>
            <span>
              Build a request and hit <strong>Send request</strong>.
            </span>
          </EmptyState>
        )}

        {response && !loading && (
          <>
            <StatusLine response={response} />
            {!response.ok && <ErrorCallout response={response} body={parsed} />}
            {showJson ? (
              pretty && <JsonSyntax source={pretty} />
            ) : (
              <FormattedView response={parsed as SystemOneResponse} />
            )}
          </>
        )}
      </div>
    </section>
  )
}

const MODES: { value: ResponseMode; label: string }[] = [
  { value: 'formatted', label: 'Formatted' },
  { value: 'json', label: 'JSON' }
]

function StatusLine({ response }: { response: ApiResult }) {
  return (
    <div className="status-line">
      <span className={`pill ${statusTone(response.status, response.ok)}`}>
        {response.ok ? '✓' : '✗'}{' '}
        {response.status ? `HTTP ${response.status} ${response.statusText}` : response.statusText}
      </span>
      <span className="pill neutral">⏱ {formatDuration(response.durationMs)}</span>
      {response.error && <span className="status-meta err">{response.error}</span>}
    </div>
  )
}

function FormattedView({ response }: { response: SystemOneResponse }) {
  return (
    <>
      <div className="usage">
        <div className="usage-item">
          model <span className="usage-value model">{response.model}</span>
        </div>
        <div className="usage-item">
          input
          <span className="usage-value">
            <StatCounter target={response.usage.input_tokens} format={formatTokens} />
          </span>
          tok
        </div>
        <div className="usage-item">
          output
          <span className="usage-value">
            <StatCounter target={response.usage.output_tokens} format={formatTokens} />
          </span>
          tok
        </div>
      </div>
      <div className="answers">
        {Object.entries(response.answers).map(([id, answer]) => (
          <AnswerCard key={id} id={id} answer={answer} />
        ))}
      </div>
    </>
  )
}

const ERROR_TITLES: Record<number, string> = {
  401: 'Unauthorized — check your API key',
  422: 'Request failed validation',
  429: 'Rate limited',
  529: 'TypeSafe is overloaded'
}

function ErrorCallout({ response, body }: { response: ApiResult; body: unknown }) {
  const b = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null
  return (
    <div className="callout err response-error">
      <div className="callout-title">{ERROR_TITLES[response.status] ?? 'Request failed'}</div>
      {b?.error ? <p>{String(b.error)}</p> : null}
      {b?.message ? <p>{String(b.message)}</p> : null}
      {b?.detail ? <p>{JSON.stringify(b.detail)}</p> : null}
      {response.status === 422 && (
        <p>Check that your questions are well-formed — missing fields and malformed criteria return 422.</p>
      )}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1200)
    return () => clearTimeout(t)
  }, [copied])
  return (
    <button
      className="btn sm"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => setCopied(true))
      }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}
