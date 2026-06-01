'use server'

import type { ImportMap, InitReqResult, SanitizedConfig } from 'payload'

import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'

import { DefaultTemplate } from '../../templates/Default/index.js'
import { getVisibleEntities } from '../../utilities/getVisibleEntities.js'
import { NotFoundClient } from './index.client.js'

type InitReqFn = (args: {
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  key: string
  overrides?: {
    [key: string]: unknown
    fallbackLocale?: boolean
    req?: {
      query?: Record<string, unknown>
    }
    urlSuffix?: string
  }
}) => Promise<InitReqResult>

export type RenderNotFoundPageArgs = {
  config: Promise<SanitizedConfig>
  importMap: ImportMap
  initReq: InitReqFn
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const renderNotFoundPage = async ({
  config: configPromise,
  importMap,
  initReq,
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: RenderNotFoundPageArgs) => {
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
      req={req}
      searchParams={searchParams}
      user={req.user}
      visibleEntities={visibleEntities}
    >
      <NotFoundClient />
    </DefaultTemplate>
  )
}
