import type { I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { ImportMap, SanitizedConfig } from 'payload'

import { getRootPageDescriptor } from '@payloadcms/ui/views/Root/getRootPageDescriptor'
import { renderRootPageFromDescriptor } from '@payloadcms/ui/views/Root/RenderRoot'
import { notFound, redirect } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'

import { getNavPrefs } from '../../elements/Nav/getNavPrefs.js'
import { initReq } from '../../utilities/initReq.js'
import { createNextViewRenderer } from './createNextViewRenderer.js'

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
  const params = await paramsPromise
  const searchParams = await searchParamsPromise
  const segments = Array.isArray(params?.segments) ? params.segments : []

  const {
    routes: { admin: adminRoute },
  } = config

  const currentRoute = formatAdminURL({
    adminRoute,
    path: segments.length ? `/${segments.join('/')}` : null,
  })

  const queryString = `${qs.stringify(searchParams ?? {}, { addQueryPrefix: true })}`

  const initPageResult = await initReq({
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
      urlSuffix: `${currentRoute}${searchParams ? queryString : ''}`,
    },
  })

  const rootPageResult = await getRootPageDescriptor({
    importMap,
    initPageResult,
    searchParams,
    segments,
  })

  if (rootPageResult.type === 'not-found') {
    return notFound()
  }

  if (rootPageResult.type === 'redirect') {
    return redirect(rootPageResult.url)
  }

  const navPreferences = await getNavPrefs(initPageResult.req)

  return renderRootPageFromDescriptor({
    descriptor: rootPageResult.descriptor,
    importMap,
    initPageResult,
    navPreferences,
    notFound: () => notFound(),
    redirect: (url) => redirect(url),
    searchParams,
    segments,
    viewRenderer: createNextViewRenderer({ importMap }),
  })
}
