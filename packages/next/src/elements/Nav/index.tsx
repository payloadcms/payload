import type { ServerProps } from 'payload'

import { Logout } from '@payloadcms/ui'
import { RenderComponent, getCreateMappedComponent } from '@payloadcms/ui/shared'
import React from 'react'

import { NavHamburger } from './NavHamburger/index.js'
import { NavWrapper } from './NavWrapper/index.js'
import './index.scss'

const baseClass = 'nav'

import { DefaultNavClient } from './index.client.js'

export type NavProps = ServerProps

export const DefaultNav: React.FC<NavProps> = (props) => {
  const { i18n, locale, params, payload, permissions, searchParams, user } = props

  if (!payload?.config) {
    return null
  }

  const {
    admin: {
      components: { afterNavLinks, beforeNavLinks },
    },
  } = payload.config

  const createMappedComponent = getCreateMappedComponent({
    importMap: payload.importMap,
    serverProps: {
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user,
    },
  })

  const mappedBeforeNavLinks = createMappedComponent(
    beforeNavLinks,
    undefined,
    undefined,
    'beforeNavLinks',
  )
  const mappedAfterNavLinks = createMappedComponent(
    afterNavLinks,
    undefined,
    undefined,
    'afterNavLinks',
  )

  return (
    <NavWrapper baseClass={baseClass}>
      <nav className={`${baseClass}__wrap`}>
        <RenderComponent mappedComponent={mappedBeforeNavLinks} />
        <DefaultNavClient />
        <RenderComponent mappedComponent={mappedAfterNavLinks} />
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
