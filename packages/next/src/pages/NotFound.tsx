import type { Metadata } from 'next'
import type { ImportMap, SanitizedConfig } from 'payload'

import { renderNotFoundPage } from '@payloadcms/ui/views/NotFound/page'

import { getNextRequestI18n } from '../utilities/getNextRequestI18n.js'
import { initReq } from '../utilities/initReq.js'

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

export const NotFoundPage = ({
  config,
  importMap,
  params,
  searchParams,
}: {
  config: Promise<SanitizedConfig>
  importMap: ImportMap
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}) =>
  renderNotFoundPage({
    config,
    importMap,
    initReq: initReq as Parameters<typeof renderNotFoundPage>[0]['initReq'],
    params,
    searchParams,
  })
