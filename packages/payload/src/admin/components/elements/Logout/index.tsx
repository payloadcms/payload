import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import LogOut from '../../icons/LogOut'
import { useConfig } from '../../utilities/Config'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'

const baseClass = 'nav'

const DefaultLogout: React.FC<{
  tabIndex?: number
}> = ({ tabIndex }) => {
  const { t } = useTranslation('authentication')
  const config = useConfig()

  const {
    admin: { logoutRoute },
    routes: { admin },
  } = config

  return (
    <Link
      aria-label={t('logOut')}
      className={`${baseClass}__log-out`}
      tabIndex={tabIndex}
      to={`${admin}${logoutRoute}`}
    >
      <LogOut />
    </Link>
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
