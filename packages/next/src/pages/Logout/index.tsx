import React from 'react'

import { MinimalTemplate, Button } from '@payloadcms/ui'
import { meta } from '../../utilities/meta'
import { Metadata } from 'next'
import { SanitizedConfig } from 'payload/types'
import { LogoutClient } from './LogoutClient'
import { getNextT } from '../../utilities/getNextT'

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
    title: t('authentication:logout'),
    description: `${t('authentication:logoutUser')}`,
    keywords: `${t('authentication:logout')}`,
    config,
  })
}

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
