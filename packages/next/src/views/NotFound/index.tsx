import type { Metadata } from 'next'
import type { AdminViewServerProps, SanitizedConfig } from 'payload'

import { getVisibleEntities } from '@payloadcms/ui/shared'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'

import { DefaultTemplate } from '../../templates/Default/index.js'
import { getNextRequestI18n } from '../../utilities/getNextRequestI18n.js'
import { initReq } from '../../utilities/initReq.js'
import { NotFoundClient } from './index.client.js'

export const generateNotFoundViewMetadata = async ({
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

export const NotFoundPage = async ({
  config: configPromise,
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  config: Promise<SanitizedConfig>
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}) => {
  const config = await configPromise
  const { routes: { admin: adminRoute } = {} } = config

  const searchParams = await searchParamsPromise
  const queryString = `${qs.stringify(searchParams ?? {}, { addQueryPrefix: true })}`

  const {
    locale,
    permissions,
    req,
    req: { payload },
  } = await initReq({
    configPromise: config,
    key: 'RootLayout',
    overrides: {
      fallbackLocale: false,
      req: {
        query: qs.parse(queryString, {
          depth: 10,
          ignoreQueryPrefix: true,
        }),
      },
      // intentionally omit `serverURL` to keep URL relative
      urlSuffix: `${formatAdminURL({ adminRoute, path: '/not-found' })}${searchParams ? queryString : ''}`,
    },
  })

  if (!req.user || !permissions.canAccessAdmin) {
    return <NotFoundClient />
  }

  const params = await paramsPromise
  const visibleEntities = getVisibleEntities({ req })

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user}
      visibleEntities={visibleEntities}
    >
      <NotFoundClient />
    </DefaultTemplate>
  )
}

export function NotFoundView(props: AdminViewServerProps) {
  return <NotFoundClient marginTop="large" />
}
