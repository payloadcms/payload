'use client'
import { Button, Gutter, useTranslation } from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import React from 'react'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export const UnauthorizedClient: React.FC<{ logoutRoute: string }> = ({ logoutRoute }) => {
  const { t } = useTranslation()

  return (
    <Gutter>
      <h2>{t('error:unauthorized')}</h2>
      <div>{t('error:notAllowedToAccessPage')}</div>
      <Button Link={Link} el="link" to={logoutRoute}>
        {t('authentication:logOut')}
      </Button>
    </Gutter>
  )
}
