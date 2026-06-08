'use client'
import React, { Fragment } from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { InteractionEnterIcon } from '../../../icons/InteractionEnter/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Popup } from '../../Popup/index.js'

type SettingsMenuProps = {
  items: React.ReactNode[]
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ items }) => {
  const { t } = useTranslation()

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
            <InteractionEnterIcon size={16} />
          </span>
          <span className="popup-button-list__label">{t('general:settings')}</span>
          <span className="popup-button-list__chevron">
            <ChevronIcon direction="right" size={24} />
          </span>
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
