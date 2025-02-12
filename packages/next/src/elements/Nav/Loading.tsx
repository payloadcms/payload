import type { ServerProps } from 'payload'

import React from 'react'

import './index.scss'
import { NavHamburger } from './NavHamburger/index.js'
import { NavWrapper } from './NavWrapper/index.js'

const baseClass = 'nav'

import { DefaultNavClient } from './index.client.js'

export type NavProps = ServerProps

export const DefaultNavLoading: React.FC = async () => {
  return (
    <NavWrapper baseClass={baseClass}>
      <nav className={`${baseClass}__wrap`}>
        <DefaultNavClient groups={[]} navPreferences={undefined} />

        <div className={`${baseClass}__controls`}>{}</div>
      </nav>
      <div className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-content`}>
          <NavHamburger baseClass={baseClass} />
        </div>
      </div>
    </NavWrapper>
  )
}
