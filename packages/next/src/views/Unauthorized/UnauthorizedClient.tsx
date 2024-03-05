'use client'
import { Button, useTranslation } from '@payloadcms/ui'
import Link from 'next/link'
import React from 'react'

export const UnauthorizedClient: React.FC<{ logoutRoute: string }> = ({ logoutRoute }) => {
  const { t } = useTranslation()

  return (
    <React.Fragment>
      <h2>{t('error:unauthorized')}</h2>
      <p>{t('error:notAllowedToAccessPage')}</p>
      <br />
      <Button Link={Link} el="link" to={logoutRoute}>
        {t('authentication:logOut')}
      </Button>
    </React.Fragment>
  )
}
