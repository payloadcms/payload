import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import { Button, MinimalTemplate } from '@payloadcms/ui'
import React from 'react'

import { getNextT } from '../../utilities/getNextT'
import { meta } from '../../utilities/meta'
import { LogoutClient } from './LogoutClient'
import './index.scss'

const baseClass = 'logout'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const t = await getNextT({
    config: await config,
  })

  return meta({
    config,
    description: `${t('authentication:logoutUser')}`,
    keywords: `${t('authentication:logout')}`,
    title: t('authentication:logout'),
  })
}

export const Logout: React.FC<{
  config: Promise<SanitizedConfig>
  inactivity?: boolean
  searchParams: { [key: string]: string | string[] }
}> = async ({ config: configPromise, inactivity, searchParams }) => {
  const config = await configPromise

  const {
    routes: { admin },
  } = config

  return (
    <MinimalTemplate className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <LogoutClient
          adminRoute={admin}
          inactivity={inactivity}
          redirect={searchParams.redirect as string}
        />
      </div>
    </MinimalTemplate>
  )
}

export default Logout
