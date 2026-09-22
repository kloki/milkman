import { Button, GradientText, Sparkle, StatusDot } from 'performative-ui'

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
      <div className="key-status">
        <StatusDot color={apiKeyPresent ? 'var(--ok)' : 'var(--err)'} static={!apiKeyPresent} />
        <span>
          {apiKeyPresent ? (apiKeyFromEnv ? 'API key from env' : 'API key set') : 'No API key'}
        </span>
      </div>
      <Button size="sm" variant="wave" onClick={onOpenSettings}>
        Settings
      </Button>
    </header>
  )
}