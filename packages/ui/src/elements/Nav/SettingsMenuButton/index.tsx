'use client'
import React, { Fragment } from 'react'

import { GearIcon } from '../../../icons/Gear/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Popup } from '../../Popup/index.js'
import './index.scss'

const baseClass = 'settings-menu-button'

export type SettingsMenuButtonProps = {
  settingsMenu?: React.ReactNode[]
}

export const SettingsMenuButton: React.FC<SettingsMenuButtonProps> = ({ settingsMenu }) => {
  const { t } = useTranslation()

  if (!settingsMenu || settingsMenu.length === 0) {
    return null
  }

  return (
    <Popup
      button={<GearIcon ariaLabel={t('general:menu')} />}
      className={baseClass}
      horizontalAlign="left"
      id="settings-menu"
      size="small"
      verticalAlign="bottom"
    >
      {settingsMenu.map((item, i) => (
        <Fragment key={`settings-menu-item-${i}`}>{item}</Fragment>
      ))}
    </Popup>
  )
}
