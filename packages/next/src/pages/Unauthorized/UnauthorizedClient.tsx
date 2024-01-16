'use client'
import React from 'react'
import { Button, useTranslation } from '@payloadcms/ui'

export const UnauthorizedClient: React.FC<{ logoutRoute: string }> = ({ logoutRoute }) => {
  const { t } = useTranslation()

  return (
    <>
      <h2>{t('error:unauthorized')}</h2>
      <p>{t('error:notAllowedToAccessPage')}</p>
      <br />
      <Button el="link" to={logoutRoute}>
        {t('authentication:logOut')}
      </Button>
    </>
  )
}
