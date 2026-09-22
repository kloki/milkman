import type { HistoryEntry } from '../../../shared/types'
import { PRESETS } from '../presets'
import { formatTokens } from '../lib/request'
import { EmptyState, RemoveButton, statusTone } from './ui'

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
      <aside className="sidebar">
        <div className="rail">
          <button
            className="icon-btn"
            title="Show presets & history"
            aria-label="Expand sidebar"
            onClick={onToggleCollapse}
          >
            »
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <span className="sidebar-title">Requests</span>
        <button className="icon-btn" title="Collapse sidebar" aria-label="Collapse sidebar" onClick={onToggleCollapse}>
          «
        </button>
      </div>

      <div className="sidebar-body">
        <div className="eyebrow sidebar-section">Presets</div>
        {PRESETS.map((preset) => (
          <div key={preset.id} className="sidebar-item">
            <button className="sidebar-item-main" onClick={() => onLoadPreset(preset.id)}>
              <div className="item-name">
                <span className="glyph">✦</span>
                {preset.name}
              </div>
              <div className="item-meta wrap">{preset.description}</div>
            </button>
          </div>
        ))}

        <div className="eyebrow sidebar-section">
          Recent
          {history.length > 0 && (
            <button className="btn sm" onClick={onClearHistory}>
              Clear
            </button>
          )}
        </div>
        {history.length === 0 && (
          <EmptyState compact>
            No requests yet.
            <br />
            Send one and it lands here.
          </EmptyState>
        )}
        {history.map((entry) => (
          <div key={entry.id} className="sidebar-item removable">
            <button className="sidebar-item-main" onClick={() => onLoadHistory(entry)}>
              <div className="item-name">{entry.name}</div>
              <HistoryMeta entry={entry} />
            </button>
            <RemoveButton
              className="sidebar-item-remove"
              title="Delete from history"
              onClick={() => onRemoveHistory(entry.id)}
            />
          </div>
        ))}
      </div>
    </aside>
  )
}

function HistoryMeta({ entry }: { entry: HistoryEntry }) {
  const res = entry.response
  const tokens = res?.ok && res.body ? tokenCount(res.body) : 0
  return (
    <div className="item-meta">
      <span>{formatTimestamp(entry.ts)}</span>
      {res ? (
        <span className={`item-status ${statusTone(res.status, res.ok)}`}>
          {res.ok ? '✓' : '✗'} {res.status || 'error'}
        </span>
      ) : (
        <span>never sent</span>
      )}
      {tokens > 0 && <span>{formatTokens(tokens)} tok</span>}
    </div>
  )
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  const time = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  })
  const sameDay = d.toDateString() === new Date().toDateString()
  return sameDay ? time : `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${time}`
}

function tokenCount(body: unknown): number {
  if (typeof body !== 'object' || body === null) return 0
  const usage = (body as { usage?: { input_tokens?: number; output_tokens?: number } }).usage
  return (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0)
}
