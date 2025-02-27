'use client'
import React from 'react'

import { LogOutIcon } from '../../icons/LogOut/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'
import { Link } from '../Link/index.js'

const baseClass = 'nav'

export const Logout: React.FC<{
  /**
   * @deprecated
   * This prop is deprecated and will be removed in the next major version.
   * Components now import their own `Link` directly from `next/link`.
   */
  Link?: React.ComponentType
  tabIndex?: number
}> = ({ tabIndex = 0 }) => {
  const { t } = useTranslation()
  const { config } = useConfig()

  const {
    admin: {
      routes: { logout: logoutRoute },
    },
    routes: { admin: adminRoute },
  } = config

  const props = {
    'aria-label': t('authentication:logOut'),
    className: `${baseClass}__log-out`,
    prefetch: Link ? false : undefined,
    tabIndex,
    title: t('authentication:logOut'),
  }

  return (
    <Link
      {...props}
      href={formatAdminURL({
        adminRoute,
        path: logoutRoute,
      })}
    >
      <LogOutIcon />
    </Link>
  )
}
