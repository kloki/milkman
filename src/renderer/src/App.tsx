import { useCallback, useEffect, useState } from 'react'
import { Aurora } from 'performative-ui'
import type { ApiResult, HistoryEntry, Settings } from '../../shared/types'
import { Header } from './components/Header'
import { SettingsModal } from './components/SettingsModal'
import { Sidebar } from './components/Sidebar'
import { RequestPanel } from './components/RequestPanel'
import { ResponsePanel } from './components/ResponsePanel'
import { buildRequest, emptyDraft, requestToDraft } from './lib/request'
import type { DraftRequest } from './lib/request'
import { PRESETS } from './presets'

export type ResponseMode = 'formatted' | 'json'

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export default function App() {
  const [settings, setSettings] = useState<Settings>({ apiKey: '', baseUrl: 'https://api.typesafe.ai' })
  const [draft, setDraft] = useState<DraftRequest>(() => emptyDraft())
  const [response, setResponse] = useState<ApiResult | null>(null)
  const [responseMode, setResponseMode] = useState<ResponseMode>('formatted')
  const [loading, setLoading] = useState(false)
  const [sendStatus, setSendStatus] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    void window.milkman.getSettings().then(setSettings)
    void window.milkman.listHistory().then(setHistory)
  }, [])

  useEffect(() => {
    if (!settings.apiKey) return
    void window.milkman.listModels(settings.apiKey, settings.baseUrl).then((res) => {
      if (res.ok && res.models) {
        const names = res.models.map((m) => m.name)
        if (!names.includes(draft.model)) names.unshift(draft.model)
        setModels(names)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.apiKey, settings.baseUrl])

  const applyDraft = useCallback((next: DraftRequest) => {
    setDraft(next)
    setSendStatus('')
  }, [])

  const loadPreset = useCallback(
    (id: string) => {
      const preset = PRESETS.find((p) => p.id === id)
      if (preset) applyDraft(requestToDraft(preset.request, preset.name))
    },
    [applyDraft]
  )

  const loadHistory = useCallback((entry: HistoryEntry) => {
    applyDraft(requestToDraft(entry.request, entry.name))
    if (entry.response) setResponse(entry.response)
    setResponseMode('formatted')
  }, [applyDraft])

  const send = useCallback(async () => {
    const built = buildRequest(draft)
    if (!built.ok) {
      setSendStatus(`invalid:${built.errors.length}`)
      return
    }
    setLoading(true)
    setSendStatus('sending')
    setResponse(null)
    const result = await window.milkman.sendSystemOne(settings.apiKey, settings.baseUrl, built.request)
    setResponse(result)
    setLoading(false)
    setSendStatus('')
    setResponseMode(result.ok ? 'formatted' : 'json')
    const entry: HistoryEntry = {
      id: uid(),
      ts: Date.now(),
      name: draft.name || Object.keys(built.request.questions)[0] || 'unnamed',
      request: built.request,
      response: result
    }
    const next = await window.milkman.addHistory(entry)
    setHistory(next)
  }, [draft, settings.apiKey, settings.baseUrl])

  const updateSettings = useCallback(async (next: Settings) => {
    setSettings(next)
    await window.milkman.setSettings(next)
  }, [])

  return (
    <div className={`app ${sidebarCollapsed ? 'side-collapsed' : ''}`}>
      <Aurora
        className="bg-aurora"
        static={false}
        blur={90}
        blobs={[
          { color: 'rgba(255, 61, 129, 0.35)', x: 8, y: 18, size: 460 },
          { color: 'rgba(255, 158, 44, 0.28)', x: 30, y: 70, size: 380 },
          { color: 'rgba(34, 193, 255, 0.32)', x: 85, y: 12, size: 440 },
          { color: 'rgba(122, 92, 255, 0.30)', x: 78, y: 78, size: 420 },
          { color: 'rgba(46, 232, 110, 0.24)', x: 55, y: 40, size: 340 }
        ]}
      />
      <Header
        apiKeyPresent={Boolean(settings.apiKey)}
        apiKeyFromEnv={Boolean(settings.apiKeyFromEnv)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <Sidebar
        history={history}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onLoadPreset={loadPreset}
        onLoadHistory={loadHistory}
        onRemoveHistory={(id) => void window.milkman.removeHistory(id).then(setHistory)}
        onClearHistory={() => void window.milkman.clearHistory().then(() => setHistory([]))}
      />
      <main className="main">
        <RequestPanel
          draft={draft}
          onChange={applyDraft}
          models={models}
          loading={loading}
          onSend={send}
          sendStatus={sendStatus}
        />
        <ResponsePanel response={response} loading={loading} mode={responseMode} onModeChange={setResponseMode} />
      </main>
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={async (next) => {
            await updateSettings(next)
            setSettingsOpen(false)
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}