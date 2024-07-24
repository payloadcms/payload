'use client'

import { usePathname } from 'next/navigation.js'
import React from 'react'

import { useAuth } from '../../providers/Auth/index.js'
import { getComponent } from '../../providers/ComponentMap/buildComponentMap/getComponent.js'
import { useComponentMap } from '../../providers/ComponentMap/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { DefaultAccountIcon } from './Default/index.js'
import { GravatarAccountIcon } from './Gravatar/index.js'

export const Account = () => {
  const {
    admin: {
      avatar,
      routes: { account: accountRoute },
    },
    routes: { admin: adminRoute },
  } = useConfig()

  const { componentImportMap } = useComponentMap()

  const { user } = useAuth()
  const pathname = usePathname()

  const isOnAccountPage = pathname === `${adminRoute}${accountRoute}`

  if (typeof avatar === 'object' && avatar && 'Component' in avatar) {
    const AvatarComponent = getComponent({
      componentImportMap,
      payloadComponent: avatar.Component,
    })
    if (AvatarComponent.component) {
      const Component = AvatarComponent.component
      return <Component active={isOnAccountPage} {...AvatarComponent.clientProps} />
    }
    return null
  }

  if (!user?.email || avatar === 'default') return <DefaultAccountIcon active={isOnAccountPage} />
  if (avatar === 'gravatar') return <GravatarAccountIcon />
}
