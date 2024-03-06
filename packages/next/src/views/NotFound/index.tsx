import type { SanitizedConfig } from 'payload/types'

import { DefaultTemplate } from '@payloadcms/ui'
import React from 'react'

import { initPage } from '../../utilities/initPage'
import { NotFoundClient } from './index.client'

export const NotFoundView = async ({
  config: configPromise,
  params,
  searchParams,
}: {
  config: Promise<SanitizedConfig>
  params: {
    [key: string]: string | string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}) => {
  const config = await configPromise

  const initPageResult = await initPage({
    config,
    route: '',
    searchParams,
  })

  return (
    <DefaultTemplate
      config={initPageResult.req.payload.config}
      i18n={initPageResult.req.i18n}
      permissions={initPageResult.permissions}
      user={initPageResult.req.user}
    >
      <NotFoundClient />
    </DefaultTemplate>
  )
}
