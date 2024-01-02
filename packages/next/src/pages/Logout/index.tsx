import React from 'react'

import { MinimalTemplate, Button } from '@payloadcms/ui'
import { meta } from '../../utilities/meta'
import './index.scss'
import i18n from 'i18next'
import { Metadata } from 'next'
import { SanitizedConfig } from 'payload/types'
import { LogoutClient } from './LogoutClient'

const baseClass = 'logout'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> =>
  meta({
    title: i18n.t('logout'),
    description: `${i18n.t('logoutUser')}`,
    keywords: `${i18n.t('logout')}`,
    config,
  })

export const Logout: React.FC<{
  inactivity?: boolean
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string[] | string }
}> = async ({ searchParams, config: configPromise, inactivity }) => {
  const config = await configPromise

  const {
    routes: { admin },
  } = config

  return (
    <MinimalTemplate className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <LogoutClient
          inactivity={inactivity}
          adminRoute={admin}
          redirect={searchParams.redirect as string}
        />
      </div>
    </MinimalTemplate>
  )
}

export default Logout
