import type { Metadata } from 'next'
import type { InitPageResult } from 'payload/types'

import React from 'react'

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

type Props = {
  page: InitPageResult
}
export const Unauthorized: React.FC<Props> = ({ page }) => {
  const {
    req: {
      payload: { config },
    },
  } = page

  const {
    admin: { logoutRoute },
    routes: { admin },
  } = config

  return <UnauthorizedClient logoutRoute={`${admin}${logoutRoute}`} />
}
