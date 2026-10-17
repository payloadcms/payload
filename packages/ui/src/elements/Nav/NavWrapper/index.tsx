'use client'
import React from 'react'

import { useAuth } from '../../../providers/Auth/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useEmbed } from '../../../providers/Embed/index.js'
import { useNav } from '../context.js'
import './index.css'

/**
 * @internal
 */
export const NavWrapper: React.FC<{
  baseClass?: string
  children: React.ReactNode
  header?: React.ReactNode
}> = (props) => {
  const { baseClass, children, header } = props

  const { hydrated, navOpen, navRef } = useNav()
  const { user } = useAuth()
  const { config, getEntityConfig } = useConfig()
  const { isEmbedded } = useEmbed()
  const userCollection = getEntityConfig({ collectionSlug: config.admin.user })
  const canLogOutLocally = Boolean(
    userCollection?.auth &&
      !userCollection.auth.disableLocalStrategy &&
      user?.collection === config.admin.user &&
      user?._strategy === 'local-jwt',
  )

  return (
    <aside
      className={[
        baseClass,
        navOpen && `${baseClass}--nav-open`,
        hydrated && `${baseClass}--nav-hydrated`,
      ]
        .filter(Boolean)
        .join(' ')}
      inert={!navOpen ? true : undefined}
    >
      {(!isEmbedded || canLogOutLocally) && header}
      <div className={`${baseClass}__scroll`} ref={navRef}>
        {children}
      </div>
    </aside>
  )
}
