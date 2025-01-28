'use client'
import React from 'react'

import { LogOutIcon } from '../../icons/LogOut/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'

const baseClass = 'nav'

export const Logout: React.FC<{
  Link?: React.ComponentType
  tabIndex?: number
}> = ({ Link, tabIndex = 0 }) => {
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

  const props = {
    'aria-label': t('authentication:logOut'),
    className: `${baseClass}__log-out`,
    prefetch: Link ? false : undefined,
    tabIndex,
    title: t('authentication:logOut'),
  }

  return (
    <LinkElement
      {...props}
      href={formatAdminURL({
        adminRoute,
        basePath,
        path: logoutRoute,
      })}
    >
      <LogOutIcon />
    </LinkElement>
  )
}
