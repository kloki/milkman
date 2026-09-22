import type { ReactNode } from 'react'
import { WibblingSpinner } from 'performative-ui'

/** Pill segmented control used for panel view switches and question types. */
export function Segmented<T extends string>({
  options,
  value,
  onChange
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          className={`segmented-btn ${value === o.value ? 'active' : ''}`}
          data-t={o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function FieldError({ message }: { message?: string }) {
  return message ? <div className="hint error">{message}</div> : null
}

export function RemoveButton({
  title,
  onClick,
  className
}: {
  title: string
  onClick: () => void
  className?: string
}) {
  return (
    <button className={`icon-btn danger ${className ?? ''}`} title={title} aria-label={title} onClick={onClick}>
      ✕
    </button>
  )
}

export function Evaluating() {
  return (
    <WibblingSpinner
      glyphs={['✦', '✧', '⋆', '·']}
      glyphColor="var(--accent)"
      verbs={['Evaluating', 'Scoring', 'Weighing', 'Calibrating']}
      verbInterval={1400}
    />
  )
}

export function EmptyState({ children, compact }: { children: ReactNode; compact?: boolean }) {
  return <div className={`empty-state ${compact ? 'compact' : ''}`}>{children}</div>
}

export type Tone = 'ok' | 'warn' | 'err'

/** Maps an HTTP result to a status tone. Status 0 means the request never got a response. */
export function statusTone(status: number, ok: boolean): Tone {
  if (ok) return 'ok'
  if (status === 0 || status >= 500) return 'err'
  return 'warn'
}
