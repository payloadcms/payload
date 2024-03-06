import React from 'react'

import { NotFoundClient } from './index.client'
import { DefaultTemplate } from '@payloadcms/ui'
import { SanitizedConfig } from 'payload/types'
import { initPage } from '../../utilities/initPage'

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
    searchParams,
    route: '',
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
