'use client'
import React from 'react'

import { LogOutIcon } from '../../icons/LogOut/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'
import { RenderComponent } from '../RenderComponent/index.js'

const baseClass = 'nav'

const DefaultLogout: React.FC<{
  Link: React.ComponentType
  tabIndex?: number
}> = ({ Link, tabIndex }) => {
  const { t } = useTranslation()
  const { config } = useConfig()

  const {
    admin: {
      routes: { logout: logoutRoute },
    },
    routes: { admin: adminRoute },
  } = config

  const basePath = process.env.NEXT_BASE_PATH ?? ''
  const LinkElement = Link || 'a'

  return (
    <LinkElement
      aria-label={t('authentication:logOut')}
      className={`${baseClass}__log-out`}
      href={formatAdminURL({
        adminRoute,
        basePath,
        path: logoutRoute,
      })}
      tabIndex={tabIndex}
    >
      <LogOutIcon />
    </LinkElement>
  )
}

export const Logout: React.FC<{
  Link?: React.ComponentType
  tabIndex?: number
}> = ({ Link, tabIndex = 0 }) => {
  // const {
  //   config: {
  //     admin: {
  //       components: { LogoutButton: CustomLogout },
  //     },
  //   },
  // } = useConfig()

  // if (CustomLogout) {
  //   return <RenderComponent mappedComponent={CustomLogout} />
  // }

  return <DefaultLogout Link={Link} tabIndex={tabIndex} />
}
