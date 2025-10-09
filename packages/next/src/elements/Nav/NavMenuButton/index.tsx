'use client'
import { GearIcon, Popup, useTranslation } from '@payloadcms/ui'
import React, { Fragment } from 'react'

import './index.scss'

const baseClass = 'nav-menu-button'

export type NavMenuButtonProps = {
  navMenuItems?: React.ReactNode[]
}

export const NavMenuButton: React.FC<NavMenuButtonProps> = ({ navMenuItems }) => {
  const { t } = useTranslation()

  if (!navMenuItems || navMenuItems.length === 0) {
    return null
  }

  return (
    <Popup
      button={<GearIcon ariaLabel={t('general:menu')} />}
      className={baseClass}
      horizontalAlign="left"
      id="nav-menu"
      size="small"
      verticalAlign="bottom"
    >
      {navMenuItems.map((item, i) => (
        <Fragment key={`nav-menu-item-${i}`}>{item}</Fragment>
      ))}
    </Popup>
  )
}
