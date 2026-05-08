import './index.css'
import type { Theme } from '../../hooks/useTheme'

type TopBarProps = {
  isHighContrast: boolean
  onThemeChange: (theme: Theme) => void
  onToggleHighContrast: () => void
  theme: Theme
}

export function TopBar({
  isHighContrast,
  onThemeChange,
  onToggleHighContrast,
  theme,
}: TopBarProps) {
  return (
    <header className="topbar">
      <span className="topbar__title">Payload Pattern Library</span>
      <div className="topbar__controls">
        <div className="topbar__theme-group">
          <button
            className={`topbar__theme-btn${theme === 'light' ? ' topbar__theme-btn--active' : ''}`}
            onClick={() => onThemeChange('light')}
            type="button"
          >
            Light
          </button>
          <button
            className={`topbar__theme-btn${theme === 'dark' ? ' topbar__theme-btn--active' : ''}`}
            onClick={() => onThemeChange('dark')}
            type="button"
          >
            Dark
          </button>
        </div>
        <button
          className={`topbar__theme-btn topbar__hc-btn${isHighContrast ? ' topbar__theme-btn--active' : ''}`}
          onClick={onToggleHighContrast}
          title="Toggle high contrast (functionality coming soon)"
          type="button"
        >
          HC
        </button>
      </div>
    </header>
  )
}
