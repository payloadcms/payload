import React from 'react'
import { useTranslation } from 'react-i18next'

import Button from '../../elements/Button'
import MinimalTemplate from '../../templates/Minimal'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import Meta from '../../utilities/Meta'

const Unauthorized: React.FC = () => {
  const { t } = useTranslation('general')
  const config = useConfig()
  const { user } = useAuth()
  const {
    admin: { logoutRoute },
    routes: { admin },
  } = config
  return (
    <MinimalTemplate className="unauthorized">
      <Meta
        description={t('error:unauthorized')}
        keywords={t('error:unauthorized')}
        title={t('error:unauthorized')}
      />
      <h2>{user ? t('general:unauthorized') : t('error:unauthorized')}</h2>
      <p>{t('error:notAllowedToAccessPage')}</p>
      <br />
      <Button el="link" to={`${admin}${user ? '' : logoutRoute}`}>
        {user ? t('general:backToDashboard') : t('authentication:logOut')}
      </Button>
    </MinimalTemplate>
  )
}

export default Unauthorized
