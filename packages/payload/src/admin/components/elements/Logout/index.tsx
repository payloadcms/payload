import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import LogOut from '../../icons/LogOut'
import { useConfig } from '../../utilities/Config'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'

const baseClass = 'nav'

const DefaultLogout = () => {
  const { t } = useTranslation('authentication')
  const config = useConfig()
  const {
    admin: {
      components: { logout },
      logoutRoute,
    },
    routes: { admin },
  } = config
  return (
    <Link
      aria-label={t('logOut')}
      className={`${baseClass}__log-out`}
      to={`${admin}${logoutRoute}`}
    >
      <LogOut />
    </Link>
  )
}

const Logout: React.FC = () => {
  const {
    admin: {
      components: {
        logout: { Button: CustomLogout } = {
          Button: undefined,
        },
      } = {},
    } = {},
  } = useConfig()

  return <RenderCustomComponent CustomComponent={CustomLogout} DefaultComponent={DefaultLogout} />
}

export default Logout
