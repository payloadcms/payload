'use client'
import React, { Fragment } from 'react'

import { ChevronIcon } from '../../../icons/Chevron/index.js'
import { GearIcon } from '../../../icons/Gear/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Popup } from '../../Popup/index.js'

type SettingsMenuProps = {
  items: React.ReactNode[]
  onMobileOpen?: () => void
}

export const SettingsMenuContent: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <>
    {items.map((item, i) => (
      <Fragment key={`settings-item-${i}`}>{item}</Fragment>
    ))}
  </>
)

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ items, onMobileOpen }) => {
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
          <GearIcon size={24} />
        </span>
        <span className="popup-button-list__label">{t('general:settings')}</span>
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
            <GearIcon size={24} />
          </span>
          <span className="popup-button-list__label">{t('general:settings')}</span>
          <span className="popup-button-list__chevron">
            <ChevronIcon direction="right" size={24} />
          </span>
        </button>
      )}
      side="left"
      size="large"
      theme="dark"
    >
      <SettingsMenuContent items={items} />
    </Popup>
  )
}
