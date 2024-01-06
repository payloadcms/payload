'use client'
import React from 'react'
import { useTranslation } from '../../providers/Translation'

import { LogOut } from '../../icons/LogOut'
import { useConfig } from '../../providers/Config'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent'

const baseClass = 'nav'

const DefaultLogout: React.FC<{
  tabIndex?: number
  Link: React.ComponentType
}> = ({ tabIndex, Link }) => {
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
      tabIndex={tabIndex}
      // to={`${admin}${logoutRoute}`} // for `react-router-dom`
      href={`${admin}${logoutRoute}`} // for `next/link`
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
