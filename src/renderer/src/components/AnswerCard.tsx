import { useId } from 'react'
import type { Answer } from '../../../shared/types'

const HUES = [
  'var(--hue-0)',
  'var(--hue-1)',
  'var(--hue-2)',
  'var(--hue-3)',
  'var(--hue-4)',
  'var(--hue-5)',
  'var(--hue-6)'
]

/** Mirrors the --rainbow gradient stops so SVG fills match the CSS gradient. */
const RAINBOW_STOPS = HUES.map((color, i) => ({
  offset: `${(i / (HUES.length - 1)) * 100}%`,
  color
}))

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const pct = (v: number) => `${Math.round(clamp01(v) * 100)}%`

export function AnswerCard({ id, answer }: { id: string; answer: Answer }) {
  return (
    <article className="answer-card">
      <div className="answer-head">
        <span className="answer-id">{id}</span>
        <span className="type-badge" data-t={answer.type}>
          {answer.type}
        </span>
      </div>
      <div className="answer-body">
        {answer.type === 'noul' && <NoulView value={answer.noul} />}
        {answer.type === 'choice' && (
          <>
            <div className="choice-winner">
              <span className="eyebrow">Picked</span>
              <span className="choice-winner-value">{answer.choice}</span>
            </div>
            <ProbabilityBars probabilities={answer.probabilities} winner={answer.choice} />
            <ConfidenceMeter value={answer.confidence} />
          </>
        )}
        {answer.type === 'score' && (
          <>
            <ScoreScale score={answer.score} legend={answer.legend} />
            <ProbabilityBars probabilities={answer.probabilities} legend={answer.legend} />
            <ConfidenceMeter value={answer.confidence} />
          </>
        )}
      </div>
    </article>
  )
}

function NoulView({ value }: { value: number }) {
  const yes = value >= 0.5
  return (
    <div className="noul-wrap">
      <NoulGauge value={value} />
      <div className="noul-text">
        <span className={`pill ${yes ? 'ok' : 'err'}`}>{yes ? 'Likely yes' : 'Likely no'}</span>
        <p className="noul-desc">
          The model assigns a probability of <strong>{pct(value)}</strong> that the answer to this yes/no question is{' '}
          <strong>yes</strong>.
        </p>
      </div>
    </div>
  )
}

function NoulGauge({ value }: { value: number }) {
  const gradientId = useId()
  const arc = 'M 8 82 A 67 67 0 0 1 142 82'
  return (
    <div className="noul-gauge">
      <svg width="150" height="90" viewBox="0 0 150 90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            {RAINBOW_STOPS.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>
        <path d={arc} fill="none" stroke="var(--surface-3)" strokeWidth="16" strokeLinecap="round" pathLength="100" />
        <path
          d={arc}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="16"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${clamp01(value) * 100} 100`}
        />
      </svg>
      <span className="big-number">{pct(value)}</span>
    </div>
  )
}

function ScoreScale({ score, legend }: { score: number; legend: Record<string, string> }) {
  const levels = Object.keys(legend).sort((a, b) => Number(a) - Number(b))
  const n = Math.max(1, levels.length)
  const markerPct = n <= 1 ? 0 : (Math.max(0, Math.min(n - 1, score)) / (n - 1)) * 100

  return (
    <div>
      <div className="score-value-line">
        <span className="big-number grad-text">{score.toFixed(2)}</span>
        <span className="hint">
          weighted across {n} levels (0–{n - 1})
        </span>
      </div>
      <div className="score-scale">
        {levels.map((level, i) => (
          <div key={level} className="score-seg" style={{ background: HUES[i % HUES.length] }} title={legend[level]} />
        ))}
        <div className="score-marker" style={{ left: `${markerPct}%` }}>
          ✦
        </div>
      </div>
      <div className="score-labels">
        {levels.map((level) => (
          <div key={level} className="score-label" title={legend[level]}>
            {legend[level]}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProbabilityBars({
  probabilities,
  winner,
  legend
}: {
  probabilities: Record<string, number>
  winner?: string
  legend?: Record<string, string>
}) {
  const rows = Object.entries(probabilities).sort((a, b) => b[1] - a[1])
  return (
    <div className="prob-bars">
      {rows.map(([key, value], i) => {
        const isWinner = key === winner
        const label = legend?.[key] ?? key
        return (
          <div className="prob-row" key={key}>
            <span className={`prob-label ${legend ? 'prose' : ''}`} title={label}>
              {label}
            </span>
            <div className="prob-track">
              <div
                className={`prob-fill ${isWinner ? 'highlight' : ''}`}
                style={{
                  width: pct(value),
                  background: isWinner ? 'var(--rainbow)' : HUES[i % HUES.length]
                }}
              />
            </div>
            <span className="prob-value">{pct(value)}</span>
          </div>
        )
      })}
    </div>
  )
}

function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div className="meter">
      <div className="eyebrow">
        <span>Confidence</span>
        <span>{pct(value)}</span>
      </div>
      <div className="meter-track">
        <div className="meter-fill" style={{ width: pct(value) }} />
      </div>
    </div>
  )
}
