'use client'
import React from 'react'

import { GearIcon } from '../../../icons/Gear/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { Button } from '../../Button/index.js'
import { MenuSeparator } from '../../MenuSeparator/index.js'
import { Popup } from '../../Popup/index.js'
import { EditViewWidthSettings } from '../EditViewWidthSettings/index.js'
import { TypeSizeSettings } from '../TypeSizeSettings/index.js'
import './index.css'

export const SettingsMenu: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Popup
      caret={false}
      className="app-header-settings"
      horizontalAlign="right"
      renderButton={({ active, onClick, onKeyDown, ...ariaProps }) => (
        <Button
          buttonStyle="secondary"
          extraButtonProps={{ ...ariaProps, onKeyDown }}
          icon={<GearIcon size={24} />}
          iconPosition="left"
          onClick={onClick}
          selected={active}
        >
          {t('general:settings')}
        </Button>
      )}
      size="large"
      theme="dark"
      verticalAlign="bottom"
    >
      <TypeSizeSettings />
      <MenuSeparator />
      <EditViewWidthSettings />
    </Popup>
  )
}
