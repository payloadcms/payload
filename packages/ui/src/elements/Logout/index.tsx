'use client'
import React from 'react'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { LogOut } from '../../icons/LogOut/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

const baseClass = 'nav'

const DefaultLogout: React.FC<{
  Link: React.ComponentType
  tabIndex?: number
}> = ({ Link, tabIndex }) => {
  const { t } = useTranslation()
  const config = useConfig()

  const {
    admin: { logoutRoute },
    routes: { admin },
  } = config

  const LinkElement = Link || 'a'

  return (
    <LinkElement
      aria-label={t('authentication:logOut')}
      className={`${baseClass}__log-out`}
      href={`${admin}${logoutRoute}`}
      tabIndex={tabIndex}
    >
      <LogOut />
    </LinkElement>
  )
}

const Logout: React.FC<{
  tabIndex?: number
}> = ({ tabIndex = 0 }) => {
  const {
    admin: {
      components: {
        logout: { Button: CustomLogout } = {
          Button: undefined,
        },
      } = {},
    } = {},
  } = useConfig()

  return (
    <RenderCustomComponent
      CustomComponent={CustomLogout}
      DefaultComponent={DefaultLogout}
      componentProps={{
        tabIndex,
      }}
    />
  )
}

export default Logout
