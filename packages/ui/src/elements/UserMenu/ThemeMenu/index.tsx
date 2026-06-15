'use client'
import React from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { VariableColorIcon } from '../../../icons/VariableColor/index.js'
import { useTheme } from '../../../providers/Theme/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Popup, PopupList } from '../../Popup/index.js'

export const ThemeMenuContent: React.FC = () => {
  const { autoMode, setTheme, theme } = useTheme()
  const { t } = useTranslation()

  const options: { label: string; value: 'auto' | 'dark' | 'light' }[] = [
    { label: t('general:auto'), value: 'auto' },
    { label: t('general:light'), value: 'light' },
    { label: t('general:dark'), value: 'dark' },
  ]

  const activeValue: 'auto' | 'dark' | 'light' = autoMode ? 'auto' : theme

  return (
    <div data-popup-prevent-close>
      <PopupList.RadioGroup>
        {options.map(({ label, value }) => (
          <PopupList.RadioGroupItem
            active={activeValue === value}
            key={value}
            onClick={() => setTheme(value)}
          >
            {label}
          </PopupList.RadioGroupItem>
        ))}
      </PopupList.RadioGroup>
    </div>
  )
}

export const ThemeMenu: React.FC<{
  readonly onMobileOpen?: () => void
}> = ({ onMobileOpen }) => {
  const { t } = useTranslation()

  if (onMobileOpen) {
    return (
      <button
        className="popup-button-list__button popup-button-list__button--submenu-trigger"
        data-popup-prevent-close
        onClick={onMobileOpen}
        type="button"
      >
        <span className="popup-button-list__submenu-icon">
          <VariableColorIcon size={24} />
        </span>
        <span className="popup-button-list__label">{t('general:theme')}</span>
        <span className="popup-button-list__chevron">
          <ChevronIcon direction="right" size={24} />
        </span>
      </button>
    )
  }

  return (
    <Popup
      renderButton={({ active, onClick, onKeyDown, ...aria }) => (
        <button
          {...aria}
          className={[
            'popup-button-list__button',
            'popup-button-list__button--submenu-trigger',
            active && 'popup-button-list__button--selected',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={onClick}
          onKeyDown={onKeyDown}
          type="button"
        >
          <span className="popup-button-list__submenu-icon">
            <VariableColorIcon size={24} />
          </span>
          <span className="popup-button-list__label">{t('general:theme')}</span>
          <span className="popup-button-list__chevron">
            <ChevronIcon direction="right" size={24} />
          </span>
        </button>
      )}
      side="left"
      size="large"
      theme="dark"
    >
      <ThemeMenuContent />
    </Popup>
  )
}
