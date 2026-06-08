'use client'
import React from 'react'

import { useTheme } from '../../../providers/Theme/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Popup, PopupList } from '../../Popup/index.js'

export const ThemeMenu: React.FC = () => {
  const { autoMode, setTheme, theme } = useTheme()
  const { t } = useTranslation()

  const options: { label: string; value: 'auto' | 'dark' | 'light' }[] = [
    { label: t('general:auto'), value: 'auto' },
    { label: t('general:light'), value: 'light' },
    { label: t('general:dark'), value: 'dark' },
  ]

  const activeValue: 'auto' | 'dark' | 'light' = autoMode ? 'auto' : theme

  return (
    <Popup
      renderButton={({ active: _active, onClick, onKeyDown, ...aria }) => (
        <button
          {...aria}
          className="popup-button-list__button"
          onClick={onClick}
          onKeyDown={onKeyDown}
          type="button"
        >
          <span className="popup-button-list__label">{t('general:theme')}</span>
        </button>
      )}
      side="left"
      size="large"
      theme="dark"
    >
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
    </Popup>
  )
}
