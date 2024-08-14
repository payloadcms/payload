import type { I18n } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type {
  AdminViewComponent,
  ImportMap,
  PayloadServerReactComponent,
  SanitizedConfig,
} from 'payload'

import { HydrateAuthProvider } from '@payloadcms/ui'
import { formatAdminURL } from '@payloadcms/ui/shared'
import React, { Fragment } from 'react'

import { DefaultTemplate } from '../../templates/Default/index.js'
import { getNextRequestI18n } from '../../utilities/getNextRequestI18n.js'
import { initPage } from '../../utilities/initPage/index.js'
import { NotFoundClient } from './index.client.js'

export const generatePageMetadata = async ({
  config: configPromise,
}: {
  config: Promise<SanitizedConfig> | SanitizedConfig
  params?: { [key: string]: string | string[] }
}): Promise<Metadata> => {
  const config = await configPromise

  const i18n = await getNextRequestI18n({
    config,
  })

  return {
    title: i18n.t('general:notFound'),
  }
}

export type GenerateViewMetadata = (args: {
  config: SanitizedConfig
  i18n: I18n
  params?: { [key: string]: string | string[] }
}) => Promise<Metadata>

export const NotFoundPage = async ({
  config: configPromise,
  importMap,
  params,
  searchParams,
}: {
  config: Promise<SanitizedConfig>
  importMap: ImportMap
  params: {
    segments: string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}) => {
  const config = await configPromise
  const { routes: { admin: adminRoute } = {} } = config

  const initPageResult = await initPage({
    config,
    importMap,
    redirectUnauthenticatedUser: true,
    route: formatAdminURL({ adminRoute, path: '/not-found' }),
    searchParams,
  })

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user}
      visibleEntities={initPageResult.visibleEntities}
    >
      <NotFoundClient />
    </DefaultTemplate>
  )
}

export const NotFoundView: PayloadServerReactComponent<AdminViewComponent> = () => {
  return <NotFoundClient marginTop="large" />
}
