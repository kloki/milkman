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
const RAINBOW_STOPS = [
  { offset: '0%', color: 'var(--hue-0)' },
  { offset: '16%', color: 'var(--hue-1)' },
  { offset: '33%', color: 'var(--hue-2)' },
  { offset: '50%', color: 'var(--hue-3)' },
  { offset: '66%', color: 'var(--hue-4)' },
  { offset: '83%', color: 'var(--hue-5)' },
  { offset: '100%', color: 'var(--hue-6)' }
]

export function AnswerCard({ id, answer }: { id: string; answer: Answer }) {
  return (
    <article className="answer-card" style={{ boxShadow: 'none', border: 'none' }}>
      <div className="answer-head">
        <span className="answer-id">{id}</span>
        <span className="answer-type-badge" data-t={answer.type}>
          {answer.type}
        </span>
      </div>
      <div className="answer-body">
        {answer.type === 'noul' && <NoulView value={answer.noul} />}
        {answer.type === 'choice' && (
          <ChoiceView choice={answer.choice} probabilities={answer.probabilities} confidence={answer.confidence} />
        )}
        {answer.type === 'score' && (
          <ScoreView score={answer.score} legend={answer.legend} probabilities={answer.probabilities} confidence={answer.confidence} />
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
        <span className={`noul-verdict ${yes ? 'yes' : 'no'}`}>{yes ? 'Likely yes' : 'Likely no'}</span>
        <p className="noul-desc">
          The model assigns a probability of <strong>{Math.round(value * 100)}%</strong> that the answer to this
          yes/no question is <strong>{yes ? 'yes' : 'no'}</strong>.
        </p>
      </div>
    </div>
  )
}

function NoulGauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value))
  const label = `${Math.round(pct * 100)}`
  return (
    <div className="noul-gauge-wrap" style={{ width: 150, height: 90 }}>
      <svg width="150" height="90" viewBox="0 0 150 90">
        <defs>
          <linearGradient id="noul-fill" x1="0" y1="0" x2="1" y2="0">
            {RAINBOW_STOPS.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>
        <path d="M 8 82 A 67 67 0 0 1 142 82" fill="none" stroke="var(--surface-3)" strokeWidth="16" strokeLinecap="round" pathLength="100" />
        <path
          d="M 8 82 A 67 67 0 0 1 142 82"
          fill="none"
          stroke="url(#noul-fill)"
          strokeWidth="16"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${pct * 100} 100`}
        />
      </svg>
      <div className="noul-gauge-value">
        <span className="num">{label}%</span>
      </div>
    </div>
  )
}

function ChoiceView({
  choice,
  probabilities,
  confidence
}: {
  choice: string
  probabilities: Record<string, number>
  confidence: number
}) {
  const sorted = Object.entries(probabilities).sort((a, b) => b[1] - a[1])
  return (
    <div>
      <div className="choice-winner">
        <span className="choice-winner-label">picked</span>
        <span className="choice-winner-value">{choice}</span>
      </div>
      <ProbabilityBars rows={sorted} winner={choice} />
      <ConfidenceMeter value={confidence} />
    </div>
  )
}

function ScoreView({
  score,
  legend,
  probabilities,
  confidence
}: {
  score: number
  legend: Record<string, string>
  probabilities: Record<string, number>
  confidence: number
}) {
  const levels = Object.keys(legend).sort((a, b) => Number(a) - Number(b))
  const n = Math.max(1, levels.length)
  const markerPct = n <= 1 ? 0 : (Math.max(0, Math.min(n - 1, score)) / (n - 1)) * 100
  const sorted = Object.entries(probabilities).sort((a, b) => b[1] - a[1])

  return (
    <div>
      <div className="score-value-line">
        <span className="score-value">{score.toFixed(2)}</span>
        <span className="score-value-note">
          weighted across {n} levels (0–{n - 1})
        </span>
      </div>
      <div className="score-scale">
        {levels.map((level, i) => (
          <div
            key={level}
            className="score-seg"
            style={{ background: HUES[i % HUES.length] }}
            title={legend[level]}
          />
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
      <ProbabilityBars rows={sorted} legend={legend} />
      <ConfidenceMeter value={confidence} />
    </div>
  )
}

function ProbabilityBars({
  rows,
  winner,
  legend
}: {
  rows: [string, number][]
  winner?: string
  legend?: Record<string, string>
}) {
  return (
    <div className="prob-bars">
      {rows.map(([key, value], i) => {
        const color = HUES[i % HUES.length]
        const isWinner = winner !== undefined && key === winner
        const label = legend ? legend[key] ?? key : key
        return (
          <div className="prob-row" key={key}>
            <span className="prob-label" title={label}>
              {label}
            </span>
            <div className="prob-track">
              <div
                className={`prob-fill ${isWinner ? 'highlight' : ''}`}
                style={{
                  width: `${value * 100}%`,
                  background: isWinner ? 'var(--rainbow)' : color,
                  ['--fill' as string]: 'var(--hue-5)'
                }}
              />
            </div>
            <span className="prob-value">{(value * 100).toFixed(0)}%</span>
          </div>
        )
      })}
    </div>
  )
}

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="confidence">
      <div className="confidence-label">
        <span>Confidence</span>
        <span>{pct}%</span>
      </div>
      <div className="confidence-track">
        <div className="confidence-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}