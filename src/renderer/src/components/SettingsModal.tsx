import { useState } from 'react'
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
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null)

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
    onSave({ apiKey: apiKey.trim(), baseUrl: baseUrl.trim() || 'https://api.typesafe.ai' })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">Settings</span>
        </div>
        <div className="modal-body">
          <div className="field">
            <label className="field-label">API key</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="ts-..."
                autoComplete="off"
                spellCheck={false}
              />
              <button className="icon-btn" onClick={() => setShowKey((s) => !s)} title={showKey ? 'Hide' : 'Show'}>
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="field">
            <label className="field-label">Base URL</label>
            <input
              className="input"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.typesafe.ai"
              spellCheck={false}
            />
          </div>
          {settings.apiKeyFromEnv && (
            <div className="env-note">
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
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void runTest()} loading={testing}>
            Test connection
          </Button>
          <Button size="sm" variant="wave" onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}