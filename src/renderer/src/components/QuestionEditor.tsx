import type { DraftQuestion, ValidationIssue } from '../lib/request'
import type { QuestionType } from '../../../shared/types'
import { FieldError, RemoveButton, Segmented } from './ui'

interface QuestionEditorProps {
  index: number
  question: DraftQuestion
  errors: ValidationIssue[]
  onChange: (partial: Partial<DraftQuestion>) => void
  onDelete: () => void
}

const TYPES: { value: QuestionType; label: string }[] = [
  { value: 'noul', label: 'Noul' },
  { value: 'choice', label: 'Choice' },
  { value: 'score', label: 'Score' }
]

export function QuestionEditor({ index, question, errors, onChange, onDelete }: QuestionEditorProps) {
  const setType = (type: QuestionType) => {
    if (type === question.type) return
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
    <div className="qcard" data-t={question.type}>
      <div className="qcard-head">
        <input
          className="input mono"
          value={question.id}
          onChange={(e) => onChange({ id: e.target.value })}
          placeholder={`question_${index + 1}`}
          aria-label="Question id"
          spellCheck={false}
        />
        <Segmented options={TYPES} value={question.type} onChange={setType} />
        <RemoveButton title="Remove question" onClick={onDelete} />
      </div>
      <FieldError message={err('id')} />

      <textarea
        className="textarea prose"
        value={question.instructions}
        onChange={(e) => onChange({ instructions: e.target.value })}
        placeholder="What should the model decide? (e.g. Which team should handle this)"
        aria-label="Instructions"
      />
      <FieldError message={err('instructions')} />

      {question.type === 'noul' && (
        <div className="input-row">
          <input
            className="input grow"
            value={question.noulTrue}
            onChange={(e) => onChange({ noulTrue: e.target.value })}
            placeholder="What “yes” means (optional)"
          />
          <input
            className="input grow"
            value={question.noulFalse}
            onChange={(e) => onChange({ noulFalse: e.target.value })}
            placeholder="What “no” means (optional)"
          />
        </div>
      )}

      {question.type === 'choice' && (
        <>
          <div className="opt-list">
            {question.choiceOptions.map((opt, i) => (
              <div className="input-row" key={i}>
                <input
                  className="input mono opt-key"
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
                <RemoveButton
                  title="Remove option"
                  onClick={() =>
                    onChange({
                      choiceOptions: question.choiceOptions.filter((_, j) => j !== i)
                    })
                  }
                />
              </div>
            ))}
          </div>
          <FieldError message={err('criteria')} />
          <div className="qcard-foot">
            <button
              className="add-btn"
              onClick={() =>
                onChange({
                  choiceOptions: [...question.choiceOptions, { option: '', description: '' }]
                })
              }
            >
              + Option
            </button>
            <span className="hint">Pick one from these options. Up to 255.</span>
          </div>
        </>
      )}

      {question.type === 'score' && (
        <>
          <div className="opt-list">
            {question.scoreLevels.map((level, i) => (
              <div className="input-row" key={i}>
                <span className="opt-index">{i}</span>
                <input
                  className="input grow"
                  value={level}
                  onChange={(e) =>
                    onChange({
                      scoreLevels: question.scoreLevels.map((l, j) => (j === i ? e.target.value : l))
                    })
                  }
                  placeholder={`Level ${i} description`}
                />
                <RemoveButton
                  title="Remove level"
                  onClick={() =>
                    onChange({
                      scoreLevels: question.scoreLevels.filter((_, j) => j !== i)
                    })
                  }
                />
              </div>
            ))}
          </div>
          <FieldError message={err('criteria')} />
          <div className="qcard-foot">
            <button className="add-btn" onClick={() => onChange({ scoreLevels: [...question.scoreLevels, ''] })}>
              + Level
            </button>
            <span className="hint">Ordered levels 0 → N. Between 2 and 10.</span>
          </div>
        </>
      )}
    </div>
  )
}
