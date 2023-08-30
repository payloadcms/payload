import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import Button from '../../elements/Button/index.js'
import Minimal from '../../templates/Minimal/index.js'
import { useAuth } from '../../utilities/Auth/index.js'
import { useConfig } from '../../utilities/Config/index.js'
import Meta from '../../utilities/Meta/index.js'
import './index.scss'

const baseClass = 'logout'

const Logout: React.FC<{ inactivity?: boolean }> = (props) => {
  const { inactivity } = props

  const { logOut } = useAuth()
  const {
    routes: { admin },
  } = useConfig()
  const { t } = useTranslation('authentication')

  // Fetch 'redirect' from the query string which denotes the URL the user originally tried to visit. This is set in the Routes.tsx file when a user tries to access a protected route and is redirected to the login screen.
  const query = new URLSearchParams(useLocation().search)
  const redirect = query.get('redirect')

  useEffect(() => {
    logOut()
  }, [logOut])

  return (
    <Minimal className={baseClass}>
      <Meta description={t('logoutUser')} keywords={t('logout')} title={t('logout')} />
      <div className={`${baseClass}__wrap`}>
        {inactivity && <h2>{t('loggedOutInactivity')}</h2>}
        {!inactivity && <h2>{t('loggedOutSuccessfully')}</h2>}
        <br />
        <Button
          url={`${admin}/login${
            redirect && redirect.length > 0 ? `?redirect=${encodeURIComponent(redirect)}` : ''
          }`}
          buttonStyle="secondary"
          el="anchor"
        >
          {t('logBackIn')}
        </Button>
      </div>
    </Minimal>
  )
}

export default Logout
