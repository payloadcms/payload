'use client'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { LogOutIcon } from '../../icons/LogOut/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { Link } from '../Link/index.js'

const baseClass = 'nav'

export const Logout: React.FC<{
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

  return (
    <Link
      aria-label={t('authentication:logOut')}
      className={`${baseClass}__log-out`}
      href={formatAdminURL({
        adminRoute,
        path: logoutRoute,
      })}
      prefetch={false}
      tabIndex={tabIndex}
      title={t('authentication:logOut')}
    >
      <LogOutIcon />
    </Link>
  )
}
