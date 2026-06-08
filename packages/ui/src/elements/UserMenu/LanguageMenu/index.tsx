'use client'
import React from 'react'

import { useTranslation } from '../../../providers/Translation/index.js'
import { Popup, PopupList } from '../../Popup/index.js'

export const LanguageMenu: React.FC = () => {
  const { i18n, languageOptions, switchLanguage, t } = useTranslation()

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
          <span className="popup-button-list__label">{t('general:language')}</span>
        </button>
      )}
      side="left"
      size="large"
      theme="auto"
    >
      <PopupList.RadioGroup>
        {languageOptions?.map(({ label, value }) => (
          <PopupList.RadioGroupItem
            active={i18n.language === value}
            key={value}
            onClick={() => {
              if (switchLanguage) {
                void switchLanguage(value)
              }
            }}
          >
            {label}
          </PopupList.RadioGroupItem>
        ))}
      </PopupList.RadioGroup>
    </Popup>
  )
}
