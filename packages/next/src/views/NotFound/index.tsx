import type { Metadata } from 'next'
import type { AdminViewServerProps, ImportMap, SanitizedConfig } from 'payload'

import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'

import { DefaultNav } from '../../elements/Nav/index.js'
import { Wrapper } from '../../templates/Default/Wrapper/index.js'
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
  importMap,
  searchParams: searchParamsPromise,
}: {
  config: Promise<SanitizedConfig>
  importMap: ImportMap
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}) => {
  const config = await configPromise
  const { routes: { admin: adminRoute } = {} } = config

  const searchParams = await searchParamsPromise
  const queryString = `${qs.stringify(searchParams ?? {}, { addQueryPrefix: true })}`

  const { permissions, req } = await initReq({
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

  return (
    <Wrapper baseClass={'test'} className={'dewf'}>
      <DefaultNav config={config} importMap={importMap} />
    </Wrapper>
  )
}

export function NotFoundView(props: AdminViewServerProps) {
  return <div> Not Found </div>
}
