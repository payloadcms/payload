import type { ImportMap, Payload, SanitizedConfig } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import { NavHamburger } from './NavHamburger/index.js'
import { NavWrapper } from './NavWrapper/index.js'
import './index.scss'

const baseClass = 'nav'

import { DefaultNavClient } from './index.client.js'

export type NavProps = {
  config: SanitizedConfig
  importMap: ImportMap
}

export const DefaultNav: React.FC<NavProps> = async (props) => {
  const { config, importMap } = props

  if (!config) {
    return null
  }

  const {
    admin: {
      components: { afterNavLinks },
    },
  } = config

  return (
    <NavWrapper baseClass={baseClass}>
      <nav className={`${baseClass}__wrap`}>
        <DefaultNavClient groups={[]} navPreferences={{ groups: {}, open: true }} />
        {Array.from({ length: 500 }).map((_, index) => (
          <div key={index}>
            {RenderServerComponent({
              clientProps: {},
              Component: afterNavLinks,
              importMap,
              serverProps: {},
            })}
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
