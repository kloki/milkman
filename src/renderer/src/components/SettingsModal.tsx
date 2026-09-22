import { useEffect, useState } from 'react'
import { Button } from 'performative-ui'
import type { Settings } from '../../../shared/types'

interface SettingsModalProps {
  settings: Settings
  onSave: (settings: Settings) => void
  onClose: () => void
}

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(settings.apiKey)
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    ok: boolean
    text: string
  } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const runTest = async () => {
    setTesting(true)
    setTestResult(null)
    const res = await window.milkman.listModels(apiKey, baseUrl)
    if (res.ok && res.models) {
      setTestResult({
        ok: true,
        text: `Connected — ${res.models.length} model${res.models.length === 1 ? '' : 's'} (${res.models.map((m) => m.name).join(', ')})`
      })
    } else {
      setTestResult({ ok: false, text: res.error ?? 'Connection failed' })
    }
    setTesting(false)
  }

  const save = () => {
    onSave({
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || 'https://api.typesafe.ai'
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <span className="modal-title" id="settings-title">
            Settings
          </span>
          <button className="icon-btn" title="Close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label className="eyebrow" htmlFor="settings-key">
              API key
            </label>
            <div className="input-row">
              <input
                id="settings-key"
                className="input mono grow"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="ts-..."
                autoComplete="off"
                spellCheck={false}
                autoFocus
              />
              <button className="btn sm" onClick={() => setShowKey((s) => !s)}>
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="field">
            <label className="eyebrow" htmlFor="settings-url">
              Base URL
            </label>
            <input
              id="settings-url"
              className="input mono"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.typesafe.ai"
              spellCheck={false}
            />
          </div>
          {settings.apiKeyFromEnv && (
            <div className="callout warn">
              No key stored locally — the <code>TYPESAFE_API_KEY</code> environment variable is currently providing the
              key.
            </div>
          )}
          {testResult && (
            <div className={`test-result ${testResult.ok ? 'ok' : 'err'}`}>
              {testResult.ok ? '✓' : '✗'} {testResult.text}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => void runTest()} disabled={testing}>
            {testing ? 'Testing…' : 'Test connection'}
          </button>
          <span className="spacer" />
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <Button size="sm" variant="wave" onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
