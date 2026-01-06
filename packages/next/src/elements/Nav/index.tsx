import React from 'react'

import { NavHamburger } from './NavHamburger/index.js'
import { NavWrapper } from './NavWrapper/index.js'

const baseClass = 'nav'

import { AfterNavLinks } from './Test/index.js'

export const DefaultNav: React.FC = () => {
  return (
    <NavWrapper baseClass={baseClass}>
      <nav className={`${baseClass}__wrap`}>
        {Array.from({ length: 3000 }).map((_, index) => (
          <div key={index}>
            <AfterNavLinks />
          </div>
        ))}
      </nav>
      <NavHamburger baseClass={baseClass} />
    </NavWrapper>
  )
}
