'use client'
import { usePathname } from 'next/navigation.js'
import React from 'react'

import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'
import { DefaultAccountIcon } from './Default/index.js'
import { GravatarAccountIcon } from './Gravatar/index.js'

export const Account = () => {
  const {
    admin: { avatar: Avatar },
    admin: {
      routes: { account: accountRoute },
    },
    routes: { admin: adminRoute },
  } = useConfig()

  const { user } = useAuth()
  const pathname = usePathname()
  const isOnAccountPage = pathname === formatAdminURL({ adminRoute, path: accountRoute })
  if (!user?.email || Avatar === 'default') return <DefaultAccountIcon active={isOnAccountPage} />
  if (Avatar === 'gravatar') return <GravatarAccountIcon />
  if (Avatar) return <Avatar active={isOnAccountPage} />
}
