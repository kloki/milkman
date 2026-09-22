import type { DraftQuestion, ValidationIssue } from '../lib/request'
import type { QuestionType } from '../../../shared/types'

interface QuestionEditorProps {
  index: number
  question: DraftQuestion
  errors: ValidationIssue[]
  onChange: (partial: Partial<DraftQuestion>) => void
  onDelete: () => void
}

const TYPES: { value: QuestionType; label: string }[] = [
  { value: 'noul', label: 'noul' },
  { value: 'choice', label: 'choice' },
  { value: 'score', label: 'score' }
]

export function QuestionEditor({ index, question, errors, onChange, onDelete }: QuestionEditorProps) {
  const setType = (type: QuestionType) => {
    onChange({
      type,
      noulTrue: '',
      noulFalse: '',
      choiceOptions: [{ option: '', description: '' }],
      scoreLevels: ['', '']
    })
  }

  const err = (path: string) => errors.find((e) => e.path === `questions[${index}].${path}`)?.message

  return (
    <div className="qcard">
      <div className="qcard-body">
        <div className="qcard-row">
          <div className="grow">
            <input
              className="input"
              value={question.id}
              onChange={(e) => onChange({ id: e.target.value })}
              placeholder={`question_${index + 1}`}
              spellCheck={false}
            />
            {err('id') && <div className="hint" style={{ color: 'var(--err)' }}>{err('id')}</div>}
          </div>
          <div className="qtype">
            {TYPES.map((t) => (
              <button
                key={t.value}
                className={`qtype-btn ${question.type === t.value ? 'active' : ''}`}
                data-t={t.value}
                onClick={() => setType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button className="mini-btn q-del" title="Remove question" onClick={onDelete}>
            ✕
          </button>
        </div>

        <textarea
          className="textarea"
          value={question.instructions}
          onChange={(e) => onChange({ instructions: e.target.value })}
          placeholder="What should the model decide? (e.g. Which team should handle this)"
          style={{ minHeight: 44 }}
        />
        {err('instructions') && <div className="hint" style={{ color: 'var(--err)' }}>{err('instructions')}</div>}

        {question.type === 'noul' && (
          <div className="opt-row">
            <div className="grow">
              <input
                className="input"
                value={question.noulTrue}
                onChange={(e) => onChange({ noulTrue: e.target.value })}
                placeholder="What “yes” means (optional)"
              />
            </div>
            <div className="grow">
              <input
                className="input"
                value={question.noulFalse}
                onChange={(e) => onChange({ noulFalse: e.target.value })}
                placeholder="What “no” means (optional)"
              />
            </div>
          </div>
        )}

        {question.type === 'choice' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {question.choiceOptions.map((opt, i) => (
                <div className="opt-row" key={i}>
                  <input
                    className="input"
                    style={{ width: 180 }}
                    value={opt.option}
                    onChange={(e) =>
                      onChange({
                        choiceOptions: question.choiceOptions.map((o, j) =>
                          j === i ? { ...o, option: e.target.value } : o
                        )
                      })
                    }
                    placeholder="option"
                    spellCheck={false}
                  />
                  <input
                    className="input grow"
                    value={opt.description}
                    onChange={(e) =>
                      onChange({
                        choiceOptions: question.choiceOptions.map((o, j) =>
                          j === i ? { ...o, description: e.target.value } : o
                        )
                      })
                    }
                    placeholder="What this option means (optional)"
                  />
                  <button
                    className="mini-btn"
                    onClick={() =>
                      onChange({ choiceOptions: question.choiceOptions.filter((_, j) => j !== i) })
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              className="add-btn"
              onClick={() => onChange({ choiceOptions: [...question.choiceOptions, { option: '', description: '' }] })}
            >
              + Option
            </button>
            {err('criteria') && <div className="hint" style={{ color: 'var(--err)' }}>{err('criteria')}</div>}
            <div className="hint">Pick one from these options. Up to 255.</div>
          </>
        )}

        {question.type === 'score' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {question.scoreLevels.map((level, i) => (
                <div className="opt-row" key={i}>
                  <span className="score-label" style={{ width: 30, textAlign: 'right', alignSelf: 'center' }}>
                    {i}
                  </span>
                  <input
                    className="input grow"
                    value={level}
                    onChange={(e) =>
                      onChange({ scoreLevels: question.scoreLevels.map((l, j) => (j === i ? e.target.value : l)) })
                    }
                    placeholder={`Level ${i} description`}
                  />
                  <button
                    className="mini-btn"
                    onClick={() => onChange({ scoreLevels: question.scoreLevels.filter((_, j) => j !== i) })}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              className="add-btn"
              onClick={() => onChange({ scoreLevels: [...question.scoreLevels, ''] })}
            >
              + Level
            </button>
            {err('criteria') && <div className="hint" style={{ color: 'var(--err)' }}>{err('criteria')}</div>}
            <div className="hint">Ordered levels 0 → N. Between 2 and 10.</div>
          </>
        )}
      </div>
    </div>
  )
}