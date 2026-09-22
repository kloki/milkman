import type { HistoryEntry } from '../../../shared/types'
import { PRESETS } from '../presets'
import { formatTokens } from '../lib/request'

interface SidebarProps {
  history: HistoryEntry[]
  collapsed: boolean
  onToggleCollapse: () => void
  onLoadPreset: (id: string) => void
  onLoadHistory: (entry: HistoryEntry) => void
  onRemoveHistory: (id: string) => void
  onClearHistory: () => void
}

export function Sidebar({
  history,
  collapsed,
  onToggleCollapse,
  onLoadPreset,
  onLoadHistory,
  onRemoveHistory,
  onClearHistory
}: SidebarProps) {
  if (collapsed) {
    return (
      <aside className="sidebar collapsed">
        <div className="rail">
          <button className="rail-btn" title="Expand sidebar" onClick={onToggleCollapse}>
            »
          </button>
          <div className="rail-divider" />
          <button className="rail-btn" title="Presets & history" onClick={onToggleCollapse}>
            ✦
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <span className="sidebar-head-title">Requests</span>
        <button className="collapse-btn" title="Collapse sidebar" onClick={onToggleCollapse}>
          «
        </button>
      </div>

      <div className="sidebar-body">
        <div className="sidebar-section">Presets</div>
        {PRESETS.map((preset) => (
          <button key={preset.id} className="sidebar-item" onClick={() => onLoadPreset(preset.id)}>
            <div className="item-name">✦ {preset.name}</div>
            <div className="preset-desc">{preset.description}</div>
          </button>
        ))}

        <div className="sidebar-section" style={{ marginTop: 16 }}>
          Recent
          {history.length > 0 && (
            <button className="mini-btn sidebar-clear-inline" onClick={onClearHistory}>
              Clear
            </button>
          )}
        </div>
        {history.length === 0 && (
          <div className="sidebar-empty">No requests yet.<br />Send one and it lands here.</div>
        )}
        {history.map((entry) => (
          <div key={entry.id} className="sidebar-item-row">
            <button className="sidebar-item" onClick={() => onLoadHistory(entry)}>
              <div className="item-name">{entry.name}</div>
              <div className="item-meta">
                {new Date(entry.ts).toLocaleString()} ·{' '}
                {entry.response?.status ? `HTTP ${entry.response.status}` : 'never sent'}
                {entry.response?.ok && entry.response.body ? ` · ${formatTokens(tokenCount(entry.response.body))} tok` : ''}
              </div>
            </button>
            <div className="sidebar-item-actions">
              <button className="mini-btn" title="Delete" onClick={() => onRemoveHistory(entry.id)}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function tokenCount(body: unknown): number {
  if (typeof body !== 'object' || body === null) return 0
  const usage = (body as { usage?: { input_tokens?: number; output_tokens?: number } }).usage
  return (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0)
}