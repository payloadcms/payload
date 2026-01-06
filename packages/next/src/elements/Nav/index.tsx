import React from 'react'

import { NavHamburger } from './NavHamburger/index.js'
import { NavWrapper } from './NavWrapper/index.js'
import './index.scss'

const baseClass = 'nav'

import { DefaultNavClient } from './index.client.js'
import { AfterNavLinks } from './Test/index.js'

export type NavProps = {}

export const DefaultNav: React.FC<NavProps> = (props) => {
  return (
    <NavWrapper baseClass={baseClass}>
      <nav className={`${baseClass}__wrap`}>
        <DefaultNavClient groups={[]} navPreferences={{ groups: {}, open: true }} />
        {Array.from({ length: 3000 }).map((_, index) => (
          <div key={index}>
            <AfterNavLinks />
          </div>
        ))}
      </nav>
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <NavHamburger baseClass={baseClass} />
        </div>
      </div>
    </NavWrapper>
  )
}
