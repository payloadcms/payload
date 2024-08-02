'use client'
import { usePathname } from 'next/navigation.js'
import React from 'react'

import { useAuth } from '../../providers/Auth/index.js'
import { RenderComponent } from '../../providers/ComponentMap/RenderComponent.js'
import { useComponentMap } from '../../providers/ComponentMap/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'
import { DefaultAccountIcon } from './Default/index.js'
import { GravatarAccountIcon } from './Gravatar/index.js'

export const Account = () => {
  const {
    config: {
      admin: {
        avatar,
        routes: { account: accountRoute },
      },
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const { componentMap } = useComponentMap()

  const { user } = useAuth()
  const pathname = usePathname()
  const isOnAccountPage = pathname === formatAdminURL({ adminRoute, path: accountRoute })

  if (componentMap.CustomAvatar) {
    return (
      <RenderComponent
        clientProps={{
          active: isOnAccountPage,
        }}
        mappedComponent={componentMap.CustomAvatar}
      />
    )
  }

  if (avatar === 'gravatar') return <GravatarAccountIcon />
}
