import type { NavPreferences } from 'payload'

import React from 'react'

import type { NavGroupType } from '../../utilities/groupNavItems.js'

import { Logout } from '../Logout/index.js'
import { NavHamburger } from './NavHamburger/index.js'
import { NavWrapper } from './NavWrapper/index.js'
import { SettingsMenuButton } from './SettingsMenuButton/index.js'
import './index.scss'

const baseClass = 'nav'

import { DefaultNavClient } from './index.client.js'

export type NavProps = {
  afterNav?: React.ReactNode
  afterNavLinks?: React.ReactNode
  beforeNav?: React.ReactNode
  beforeNavLinks?: React.ReactNode
  groups: NavGroupType[]
  logoutComponent?: React.ReactNode
  navPreferences: NavPreferences
  settingsMenu?: React.ReactNode[]
}

export const DefaultNav: React.FC<NavProps> = ({
  afterNav,
  afterNavLinks,
  beforeNav,
  beforeNavLinks,
  groups,
  logoutComponent,
  navPreferences,
  settingsMenu,
}) => {
  return (
    <NavWrapper baseClass={baseClass}>
      {beforeNav}
      <nav className={`${baseClass}__wrap`}>
        {beforeNavLinks}
        <DefaultNavClient groups={groups} navPreferences={navPreferences} />
        {afterNavLinks}
        <div className={`${baseClass}__controls`}>
          <SettingsMenuButton settingsMenu={settingsMenu ?? []} />
          {logoutComponent ?? <Logout />}
        </div>
      </nav>
      {afterNav}
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <NavHamburger baseClass={baseClass} />
        </div>
      </div>
    </NavWrapper>
  )
}
