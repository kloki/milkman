import { useMemo } from 'react'
import { GlassCard, StatCounter, WibblingSpinner } from 'performative-ui'
import type { ApiResult, SystemOneResponse } from '../../../shared/types'
import { formatDuration, formatTokens } from '../lib/request'
import { JsonSyntax, prettyPrintJson } from '../lib/json'
import { AnswerCard } from './AnswerCard'

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

  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">
          Response <span className="grad">⇄</span>
        </span>
        <div className="tabs">
          <button className={`tab-btn ${mode === 'formatted' ? 'active' : ''}`} onClick={() => onModeChange('formatted')}>
            Formatted
          </button>
          <button className={`tab-btn ${mode === 'json' ? 'active' : ''}`} onClick={() => onModeChange('json')}>
            JSON
          </button>
        </div>
      </div>

      <div className="panel-body">
        {loading && !response && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
            <WibblingSpinner glyphs={['✦', '✧', '⋆', '·']} glyphColor="var(--hue-5)" verbs={['Evaluating', 'Scoring', 'Weighing', 'Calibrating']} verbInterval={1400} />
          </div>
        )}

        {!loading && !response && (
          <div className="sidebar-empty" style={{ paddingTop: 60 }}>
            Nothing here yet.
            <br />
            Build a request and hit <strong>Send request</strong>.
          </div>
        )}

        {response && !loading && (
          <>
            <StatusLine response={response} />

            {mode === 'json' ? (
              <JsonViewer response={response} />
            ) : isResp && parsed ? (
              <FormattedView response={parsed} />
            ) : (
              <JsonViewer response={response} />
            )}
          </>
        )}
      </div>
    </section>
  )
}

function StatusLine({ response }: { response: ApiResult }) {
  const cls = response.ok ? 'ok' : response.status >= 500 ? 'err' : response.status >= 400 ? 'warn' : response.status >= 300 ? 'warn' : 'ok'
  const ok = response.ok
  return (
    <div className="status-line">
      <span className={`status-chip ${cls}`}>
        {ok ? '✓' : '✗'} {response.status ? `HTTP ${response.status} ${response.statusText}` : response.statusText}
      </span>
      <span className="status-meta">
        <span>⏱ {formatDuration(response.durationMs)}</span>
        {response.error && <span style={{ color: 'var(--err)' }}>{response.error}</span>}
      </span>
    </div>
  )
}

function FormattedView({ response }: { response: SystemOneResponse }) {
  const answers = Object.entries(response.answers)
  return (
    <div className="formatted-response">
      <div className="usage">
        <div className="u-item">
          <span>model</span>
          <span className="u-value" style={{ fontSize: 13 }}>{response.model}</span>
        </div>
        <div className="u-item">
          <span>input</span>
          <span className="u-value"><StatCounter target={response.usage.input_tokens} format={(v) => formatTokens(v)} /></span>
          <span>tok</span>
        </div>
        <div className="u-item">
          <span>output</span>
          <span className="u-value"><StatCounter target={response.usage.output_tokens} format={(v) => formatTokens(v)} /></span>
          <span>tok</span>
        </div>
      </div>
      <div className="answers">
        {answers.map(([id, answer]) => (
          <GlassCard key={id} className="answer-card" glowOnHover>
            <AnswerCard id={id} answer={answer} />
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

function JsonViewer({ response }: { response: ApiResult }) {
  const pretty = prettyPrintJson(response.rawBody)
  const body = useMemo(() => {
    try {
      return JSON.parse(response.rawBody) as Record<string, unknown>
    } catch {
      return null
    }
  }, [response.rawBody])

  if (!response.ok) {
    return (
      <>
        <div className="error-card">
          <h4>
            {response.status === 401
              ? 'Unauthorized — check your API key'
              : response.status === 422
                ? 'Request failed validation'
                : response.status === 429
                  ? 'Rate limited'
                  : response.status === 529
                    ? 'TypeSafe is overloaded'
                    : 'Request failed'}
          </h4>
          {body?.error ? <p className="error-hint">{String(body.error)}</p> : null}
          {body?.message ? <p className="error-hint">{String(body.message)}</p> : null}
          {body?.detail ? <p className="error-hint">{JSON.stringify(body.detail)}</p> : null}
          {response.status === 422 && <p className="error-hint">Check that your questions are well-formed — missing fields and malformed criteria return 422.</p>}
        </div>
        {pretty && (
          <>
            <div className="json-copy-wrap">
              <CopyButton text={pretty} />
            </div>
            <JsonSyntax source={pretty} />
          </>
        )}
      </>
    )
  }

  return (
    <>
      <div className="json-copy-wrap">
        <CopyButton text={pretty} />
      </div>
      <JsonSyntax source={pretty} />
    </>
  )
}

function CopyButton({ text }: { text: string }) {
  return (
    <button
      className="icon-btn copy-btn"
      onClick={() => {
        void navigator.clipboard.writeText(text)
      }}
    >
      Copy
    </button>
  )
}