import type { Metadata } from 'next'
import type { InitPageResult } from 'payload/types'

import React from 'react'

import type { AdminViewProps } from '../Root'

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

export const Unauthorized: React.FC<AdminViewProps> = ({ initPageResult }) => {
  const {
    req: {
      payload: {
        config: {
          admin: { logoutRoute },
          routes: { admin },
        },
      },
    },
  } = initPageResult

  return <UnauthorizedClient logoutRoute={`${admin}${logoutRoute}`} />
}
