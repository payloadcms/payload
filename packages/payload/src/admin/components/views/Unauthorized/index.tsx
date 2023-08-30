import React from 'react'
import { useTranslation } from 'react-i18next'

import Button from '../../elements/Button/index.js'
import MinimalTemplate from '../../templates/Minimal/index.js'
import { useConfig } from '../../utilities/Config/index.js'
import Meta from '../../utilities/Meta/index.js'

const Unauthorized: React.FC = () => {
  const { t } = useTranslation('general')
  const config = useConfig()
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
      <h2>{t('error:unauthorized')}</h2>
      <p>{t('error:notAllowedToAccessPage')}</p>
      <br />
      <Button el="link" to={`${admin}${logoutRoute}`}>
        {t('authentication:logOut')}
      </Button>
    </MinimalTemplate>
  )
}

export default Unauthorized
