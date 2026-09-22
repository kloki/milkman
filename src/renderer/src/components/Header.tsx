import { GradientText, Sparkle, StatusDot } from 'performative-ui'

interface HeaderProps {
  apiKeyPresent: boolean
  apiKeyFromEnv: boolean
  onOpenSettings: () => void
}

export function Header({ apiKeyPresent, apiKeyFromEnv, onOpenSettings }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="wordmark">
        <GradientText>milkman</GradientText>
        <Sparkle />
        <span className="wordmark-sub">TypeSafe playground</span>
      </div>
      <div className="header-spacer" />
      <button className="btn sm key-status" title="Open settings" onClick={onOpenSettings}>
        <StatusDot color={apiKeyPresent ? 'var(--ok)' : 'var(--err)'} static={!apiKeyPresent} />
        {apiKeyPresent ? (apiKeyFromEnv ? 'API key from env' : 'API key set') : 'No API key'}
      </button>
      <button className="btn sm" onClick={onOpenSettings}>
        Settings
      </button>
    </header>
  )
}
