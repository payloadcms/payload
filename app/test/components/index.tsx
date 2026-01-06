import React from 'react'

const baseClass = 'nav'

import { AfterNavLinks, NavHamburger, NavWrapper } from './components.js'

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
