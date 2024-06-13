import type { ServerProps } from 'payload'

import { Logout } from '@payloadcms/ui/client'
import React from 'react'

import { NavHamburger } from './NavHamburger/index.js'
import { NavWrapper } from './NavWrapper/index.js'
import './index.scss'

const baseClass = 'nav'

import { WithServerSideProps } from '@payloadcms/ui/shared'

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

  const BeforeNavLinks = Array.isArray(beforeNavLinks)
    ? beforeNavLinks.map((Component, i) => (
        <WithServerSideProps
          Component={Component}
          key={i}
          serverOnlyProps={{
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
          }}
        />
      ))
    : null

  const AfterNavLinks = Array.isArray(afterNavLinks)
    ? afterNavLinks.map((Component, i) => (
        <WithServerSideProps
          Component={Component}
          key={i}
          serverOnlyProps={{
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
          }}
        />
      ))
    : null

  return (
    <NavWrapper baseClass={baseClass}>
      <nav className={`${baseClass}__wrap`}>
        {Array.isArray(BeforeNavLinks) && BeforeNavLinks.map((Component) => Component)}
        <DefaultNavClient />
        {Array.isArray(AfterNavLinks) && AfterNavLinks.map((Component) => Component)}
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
