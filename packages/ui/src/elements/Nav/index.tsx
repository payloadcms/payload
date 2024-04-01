import type { SanitizedConfig } from 'payload/types'

import React from 'react'

import { Logout } from '../Logout/index.js'
import { NavHamburger } from './NavHamburger/index.js'
import { NavWrapper } from './NavWrapper/index.js'
import './index.scss'

const baseClass = 'nav'

import { DefaultNavClient } from './index.client.js'

export type NavProps = {
  config: SanitizedConfig
}

export const DefaultNav: React.FC<NavProps> = (props) => {
  const { config } = props

  if (!config) {
    return null
  }

  const {
    admin: {
      components: { afterNavLinks, beforeNavLinks },
    },
  } = config

  return (
    <NavWrapper baseClass={baseClass}>
      <nav className={`${baseClass}__wrap`}>
        {Array.isArray(beforeNavLinks) &&
          beforeNavLinks.map((Component, i) => <Component key={i} />)}
        <DefaultNavClient />
        {Array.isArray(afterNavLinks) && afterNavLinks.map((Component, i) => <Component key={i} />)}
        <div className={`${baseClass}__controls`}>
          <Logout />
        </div>
      </nav>
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <NavHamburger baseClass={baseClass} />
        </div>
      </div>
    </NavWrapper>
  )
}
