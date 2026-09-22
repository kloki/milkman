import { useEffect, useMemo, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { linter, lintGutter } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'
import { Button, WibblingSpinner } from 'performative-ui'
import { buildRequest, draftToRequestJson, emptyDraft } from '../lib/request'
import type { DraftRequest } from '../lib/request'
import { rainbowJsonTheme } from '../lib/jsonHighlight'
import { BuilderView } from './BuilderView'

export type RequestView = 'builder' | 'json'

interface RequestPanelProps {
  draft: DraftRequest
  onChange: (draft: DraftRequest) => void
  models: string[]
  loading: boolean
  sendStatus: string
  onSend: () => void
}

export function RequestPanel({ draft, onChange, models, loading, sendStatus, onSend }: RequestPanelProps) {
  const [view, setView] = useState<RequestView>('builder')
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [sendCount, setSendCount] = useState(0)

  const validation = useMemo(() => buildRequest(draft), [draft])

  useEffect(() => {
    if (view === 'json' && jsonText === '') {
      setJsonText(draftToRequestJson(draft))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  const switchToJson = () => {
    setJsonText(draftToRequestJson(draft))
    setJsonError(null)
    setView('json')
  }

  const onJsonChange = (value: string) => {
    setJsonText(value)
    try {
      const parsed = JSON.parse(value) as Parameters<typeof jsonToDraft>[0]
      setJsonError(null)
      onChange(jsonToDraft(parsed))
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON')
    }
  }

  const formatJson = () => {
    try {
      setJsonText(JSON.stringify(JSON.parse(jsonText), null, 2))
    } catch {
      /* keep as-is */
    }
  }

  const handleSend = () => {
    if (view === 'json') {
      try {
        onChange(jsonToDraft(JSON.parse(jsonText) as Parameters<typeof jsonToDraft>[0]))
      } catch {
        /* invalid JSON: send will be blocked by validation */
      }
    }
    setSendCount((c) => c + 1)
    onSend()
  }

  const errors = validation.ok ? [] : validation.errors
  const showErrors = sendStatus.startsWith('invalid') || sendCount > 0 ? errors : []

  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">
          Request <span className="grad">⇄</span>
        </span>
        <div className="tabs">
          <button className={`tab-btn ${view === 'builder' ? 'active' : ''}`} onClick={() => setView('builder')}>
            Builder
          </button>
          <button className={`tab-btn ${view === 'json' ? 'active' : ''}`} onClick={switchToJson}>
            JSON
          </button>
        </div>
      </div>
      <div className="panel-body">
        {view === 'builder' ? (
          <BuilderView draft={draft} onChange={onChange} models={models} errors={showErrors} />
        ) : (
          <div className="json-editor">
            <div className="json-copy-wrap">
              <button className="icon-btn copy-btn" onClick={formatJson}>
                Format
              </button>
            </div>
            <CodeMirror
              value={jsonText}
              height="100%"
              extensions={[
                json(),
                rainbowJsonTheme,
                lintGutter(),
                linter(jsonParseLinter()),
                EditorView.lineWrapping,
                EditorView.theme({
                  '&': { height: '100%', fontSize: '12.5px' },
                  '.cm-scroller': { fontFamily: 'var(--mono)' },
                  '&.cm-focused': { outline: 'none' }
                })
              ]}
              onChange={onJsonChange}
              basicSetup={{ foldGutter: true, autocompletion: true }}
            />
            {jsonError && <div className="errors" style={{ marginTop: 8 }}><div className="errors-title">Invalid JSON</div><ul><li>{jsonError}</li></ul></div>}
            <div className="hint" style={{ marginTop: 8 }}>
              JSON edits win over the builder. Switch to Builder to go back to the form — last valid parse is kept.
            </div>
          </div>
        )}
      </div>
      <div className="send-bar" style={{ padding: '0 14px 14px' }}>
        <Button className="pui-btn send-btn" variant="wave" size="md" onClick={handleSend} loading={loading}>
          Send request
        </Button>
        {loading && (
          <span className="send-status">
            <WibblingSpinner
              glyphs={['✦', '✧', '⋆', '·']}
              glyphColor="var(--hue-5)"
              verbs={['Evaluating', 'Scoring', 'Weighing', 'Calibrating']}
              verbInterval={1400}
            />
          </span>
        )}
      </div>
    </section>
  )
}

function jsonToDraft(value: Record<string, unknown>): DraftRequest {
  const draft = emptyDraft()
  draft.state = typeof value.state === 'string' ? value.state : JSON.stringify(value.state ?? '', null, 2)
  draft.model = typeof value.model === 'string' ? value.model : ''
  draft.name = typeof value.name === 'string' ? value.name : ''
  const questions = value.questions as Record<string, Record<string, unknown>> | undefined
  if (questions && typeof questions === 'object') {
    draft.questions = Object.entries(questions).map(([id, q]) => ({
      id,
      type: q.type === 'choice' || q.type === 'score' ? q.type : 'noul',
      instructions: flatten(q.instructions),
      noulTrue: q.type === 'noul' ? flatten((q.criteria as { true?: unknown } | undefined)?.true) : '',
      noulFalse: q.type === 'noul' ? flatten((q.criteria as { false?: unknown } | undefined)?.false) : '',
      choiceOptions:
        q.type === 'choice' && typeof q.criteria === 'object' && q.criteria !== null
          ? Object.entries(q.criteria as Record<string, unknown>).map(([option, description]) => ({
              option,
              description: flatten(description)
            }))
          : [{ option: '', description: '' }],
      scoreLevels:
        q.type === 'score' && Array.isArray(q.criteria) ? q.criteria.map((l) => flatten(l)) : ['', '']
    }))
  }
  return draft
}

function flatten(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}