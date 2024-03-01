import type { Metadata } from 'next'

import { MinimalTemplate } from '@payloadcms/ui'
import React from 'react'

import type { InitPageResult } from '../../utilities/initPage'

import { meta } from '../../utilities/meta'
import { UnauthorizedClient } from './UnauthorizedClient'

export const generateMetadata = async ({ page }: { page: InitPageResult }): Promise<Metadata> => {
  const {
    req: {
      payload: { config },
      t,
    },
  } = page

  return meta({
    config,
    description: t('error:unauthorized'),
    keywords: t('error:unauthorized'),
    title: t('error:unauthorized'),
  })
}

export const Unauthorized: React.FC<{
  page: InitPageResult
}> = ({ page }) => {
  const {
    req: {
      payload: { config },
    },
  } = page

  const {
    admin: { logoutRoute },
    routes: { admin },
  } = config

  return (
    <MinimalTemplate className="unauthorized">
      <UnauthorizedClient logoutRoute={`${admin}${logoutRoute}`} />
    </MinimalTemplate>
  )
}
