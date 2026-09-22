import type { DraftRequest, ValidationIssue } from '../lib/request'
import { emptyQuestion } from '../lib/request'
import { QuestionEditor } from './QuestionEditor'

interface BuilderViewProps {
  draft: DraftRequest
  onChange: (draft: DraftRequest) => void
  models: string[]
  errors: ValidationIssue[]
}

export function BuilderView({ draft, onChange, models, errors }: BuilderViewProps) {
  const setQuestion = (index: number, partial: Partial<DraftRequest['questions'][number]>) => {
    const questions = draft.questions.map((q, i) => (i === index ? { ...q, ...partial } : q))
    onChange({ ...draft, questions })
  }

  const removeQuestion = (index: number) => {
    onChange({ ...draft, questions: draft.questions.filter((_, i) => i !== index) })
  }

  const addQuestion = () => {
    onChange({ ...draft, questions: [...draft.questions, emptyQuestion()] })
  }

  const errorFor = (path: string) => {
    const issue = errors.find((e) => e.path === path)
    return issue?.message
  }

  return (
    <div className="builder">
      <div className="field">
        <label className="field-label">Request name</label>
        <input
          className="input"
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          placeholder="e.g. Support ticket triage"
        />
      </div>

      <div className="field">
        <label className="field-label">
          State <span className="req">*</span>
        </label>
        <textarea
          className="textarea state"
          value={draft.state}
          onChange={(e) => onChange({ ...draft, state: e.target.value })}
          placeholder="Paste the text or structured data to evaluate…"
        />
        {errorFor('state') && <div className="hint" style={{ color: 'var(--err)' }}>{errorFor('state')}</div>}
        <div className="hint">Objects/arrays are sent as JSON; anything else is sent as a string.</div>
      </div>

      <div className="field">
        <label className="field-label">
          Model <span className="req">*</span>
        </label>
        <input
          className="input"
          list="milkman-models"
          value={draft.model}
          onChange={(e) => onChange({ ...draft, model: e.target.value })}
          placeholder="jev-latest"
          spellCheck={false}
        />
        <datalist id="milkman-models">
          {models.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        {errorFor('model') && <div className="hint" style={{ color: 'var(--err)' }}>{errorFor('model')}</div>}
      </div>

      <div className="field">
        <div className="field-label">
          Questions <span className="req">*</span> <span style={{ textTransform: 'none', fontWeight: 500, color: 'var(--text-faint)', letterSpacing: 0 }}>— evaluated in parallel against the same state</span>
        </div>
        {errorFor('questions') && <div className="hint" style={{ color: 'var(--err)' }}>{errorFor('questions')}</div>}
        <div className="questions">
          {draft.questions.map((q, i) => (
            <QuestionEditor
              key={i}
              index={i}
              question={q}
              errors={errors.filter((e) => e.path.startsWith(`questions[${i}]`))}
              onChange={(partial) => setQuestion(i, partial)}
              onDelete={() => removeQuestion(i)}
            />
          ))}
          <button className="add-btn add-question" onClick={addQuestion}>
            + Add question
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="errors">
          <div className="errors-title">Can’t send yet</div>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>{e.path}: {e.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}