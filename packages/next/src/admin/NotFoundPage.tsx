import type { ImportMap, SanitizedConfig } from 'payload'

import { DefaultTemplate } from '@payloadcms/ui/rsc'
import { getVisibleEntities } from '@payloadcms/ui/shared'
import { initReq } from '@payloadcms/ui/utilities/initReq'
import { NotFoundClient } from '@payloadcms/ui/views/NotFound/index.client'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'

import { nextServerAdapter } from '../adapters/server.js'

/**
 * Next.js NotFoundPage — server-rendered 404 with admin chrome when the
 * visitor is authenticated, plain client 404 otherwise.
 */
export const NotFoundPage = async ({
  config: configPromise,
  importMap,
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  config: Promise<SanitizedConfig>
  importMap: ImportMap
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
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
    importMap,
    key: 'RootLayout',
    overrides: {
      fallbackLocale: false,
      req: {
        query: qs.parse(queryString, {
          depth: 10,
          ignoreQueryPrefix: true,
        }),
      },
      urlSuffix: `${formatAdminURL({ adminRoute, path: '/not-found' })}${searchParams ? queryString : ''}`,
    },
    serverAdapter: nextServerAdapter,
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
      req={req}
      searchParams={searchParams}
      user={req.user}
      visibleEntities={visibleEntities}
    >
      <NotFoundClient />
    </DefaultTemplate>
  )
}
