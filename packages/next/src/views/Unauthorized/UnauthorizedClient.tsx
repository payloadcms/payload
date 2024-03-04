'use client'
import { Button, useTranslation } from '@payloadcms/ui'
import React from 'react'

export const UnauthorizedClient: React.FC<{ logoutRoute: string }> = ({ logoutRoute }) => {
  const { t } = useTranslation()

  return (
    <React.Fragment>
      <h2>{t('error:unauthorized')}</h2>
      <p>{t('error:notAllowedToAccessPage')}</p>
      <br />
      <Button el="link" to={logoutRoute}>
        {t('authentication:logOut')}
      </Button>
    </React.Fragment>
  )
}
