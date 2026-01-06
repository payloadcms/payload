import type { I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { ImportMap, SanitizedConfig } from 'payload'

import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'

import { DefaultNav } from '../../elements/Nav/index.js'
import { Wrapper } from '../../templates/Default/Wrapper/index.js'
import { initReq } from '../../utilities/initReq.js'
export type GenerateViewMetadata = (args: {
  config: SanitizedConfig
  i18n: I18nClient
  isEditing?: boolean
  params?: { [key: string]: string | string[] }
}) => Promise<Metadata>

export const RootPage = async ({
  config: configPromise,
  importMap,
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  readonly config: Promise<SanitizedConfig>
  readonly importMap: ImportMap
  readonly params: Promise<{
    segments: string[]
  }>
  readonly searchParams: Promise<{
    [key: string]: string | string[]
  }>
}) => {
  const config = await configPromise

  const {
    admin: {
      routes: { createFirstUser: _createFirstUserRoute },
    },
    routes: { admin: adminRoute },
  } = config

  const params = await paramsPromise

  const currentRoute = formatAdminURL({
    adminRoute,
    path: Array.isArray(params.segments) ? `/${params.segments.join('/')}` : null,
  })

  const searchParams = await searchParamsPromise

  const queryString = `${qs.stringify(searchParams ?? {}, { addQueryPrefix: true })}`

  const { locale, permissions, req } = await initReq({
    configPromise: config,
    importMap,
    key: 'initPage',
    overrides: {
      fallbackLocale: false,
      req: {
        query: qs.parse(queryString, {
          depth: 10,
          ignoreQueryPrefix: true,
        }),
      },
      // intentionally omit `serverURL` to keep URL relative
      urlSuffix: `${currentRoute}${searchParams ? queryString : ''}`,
    },
  })

  return (
    <div style={{ position: 'relative' }}>
      <Wrapper baseClass={'test'} className={'dewf'}>
        <DefaultNav config={config} importMap={importMap} />
      </Wrapper>
    </div>
  )
}
