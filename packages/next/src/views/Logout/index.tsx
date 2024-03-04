import type { Metadata } from 'next'
import type { InitPageResult, SanitizedConfig } from 'payload/types'

import { MinimalTemplate } from '@payloadcms/ui'
import React from 'react'

import { getNextI18n } from '../../utilities/getNextI18n'
import { meta } from '../../utilities/meta'
import { LogoutClient } from './LogoutClient'
import './index.scss'

const baseClass = 'logout'

export const generateMetadata = async ({
  config: configPromise,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const config = await configPromise

  const { t } = await getNextI18n({
    config,
  })

  return meta({
    config,
    description: `${t('authentication:logoutUser')}`,
    keywords: `${t('authentication:logout')}`,
    title: t('authentication:logout'),
  })
}

type Props = {
  baseClass: string
  page: InitPageResult
  searchParams: { [key: string]: string | string[] }
} & {
  inactivity?: boolean
}

export const Logout: React.FC<Props> = ({ inactivity, page, searchParams }) => {
  const {
    req: {
      payload: { config },
    },
  } = page

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

export const LogoutInactivity: React.FC<Props> = (props) => {
  return <Logout inactivity {...props} />
}
