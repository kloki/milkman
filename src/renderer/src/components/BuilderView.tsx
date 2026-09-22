import type { DraftRequest, ValidationIssue } from '../lib/request'
import { emptyQuestion } from '../lib/request'
import { QuestionEditor } from './QuestionEditor'
import { FieldError } from './ui'

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
    onChange({
      ...draft,
      questions: draft.questions.filter((_, i) => i !== index)
    })
  }

  const addQuestion = () => {
    onChange({ ...draft, questions: [...draft.questions, emptyQuestion()] })
  }

  const errorFor = (path: string) => errors.find((e) => e.path === path)?.message

  return (
    <div className="stack">
      <div className="field">
        <label className="eyebrow" htmlFor="req-name">
          Request name
        </label>
        <input
          id="req-name"
          className="input"
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          placeholder="e.g. Support ticket triage"
        />
      </div>

      <div className="field">
        <label className="eyebrow" htmlFor="req-state">
          State <span className="req">*</span>
        </label>
        <textarea
          id="req-state"
          className="textarea tall"
          value={draft.state}
          onChange={(e) => onChange({ ...draft, state: e.target.value })}
          placeholder="Paste the text or structured data to evaluate…"
        />
        <FieldError message={errorFor('state')} />
        <div className="hint">Objects/arrays are sent as JSON; anything else is sent as a string.</div>
      </div>

      <div className="field">
        <label className="eyebrow" htmlFor="req-model">
          Model <span className="req">*</span>
        </label>
        <input
          id="req-model"
          className="input mono"
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
        <FieldError message={errorFor('model')} />
      </div>

      <div className="field">
        <div className="eyebrow">
          Questions <span className="req">*</span>
          <span className="aside">— evaluated in parallel against the same state</span>
        </div>
        <FieldError message={errorFor('questions')} />
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
          <button className="add-btn" onClick={addQuestion}>
            + Add question
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="callout err">
          <div className="callout-title">Can’t send yet</div>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>
                <code>{e.path}</code> — {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
