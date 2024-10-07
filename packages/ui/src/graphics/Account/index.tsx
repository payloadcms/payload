'use client'
import { usePathname } from 'next/navigation.js'
import React from 'react'

// import { RenderComponent } from '../../elements/RenderComponent/client.js'
import { useAuth } from '../../providers/Auth/index.js'
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

  const { user } = useAuth()
  const pathname = usePathname()
  const isOnAccountPage = pathname === formatAdminURL({ adminRoute, path: accountRoute })

  // if (CustomAvatar) {
  //   return (
  //     <RenderComponent
  //       clientProps={{
  //         active: isOnAccountPage,
  //       }}
  //       mappedComponent={CustomAvatar}
  //     />
  //   )
  // }

  if (!user?.email || avatar === 'default') {
    return <DefaultAccountIcon active={isOnAccountPage} />
  }
  if (avatar === 'gravatar') {
    return <GravatarAccountIcon />
  }
}
