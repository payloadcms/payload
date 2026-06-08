'use client'
import React, { Fragment } from 'react'

import { useTranslation } from '../../../providers/Translation/index.js'
import { Popup } from '../../Popup/index.js'

type SettingsMenuProps = {
  items: React.ReactNode[]
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ items }) => {
  const { t } = useTranslation()

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
          <span className="popup-button-list__label">{t('general:settings')}</span>
        </button>
      )}
      side="left"
      size="large"
      theme="auto"
    >
      {items.map((item, i) => (
        <Fragment key={`settings-item-${i}`}>{item}</Fragment>
      ))}
    </Popup>
  )
}
