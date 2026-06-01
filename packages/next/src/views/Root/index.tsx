import type { I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { ImportMap, SanitizedConfig } from 'payload'

import { renderRoot } from '@payloadcms/ui/views/Root'
import { notFound, redirect } from 'next/navigation.js'

import { initReq } from '../../utilities/initReq.js'
import { getRouteData } from './getRouteData.js'

export type GenerateViewMetadata = (args: {
  config: SanitizedConfig
  i18n: I18nClient
  isEditing?: boolean
  params?: { [key: string]: string | string[] }
}) => Promise<Metadata>

export const RootPage = ({
  config,
  importMap,
  params,
  searchParams,
}: {
  readonly config: Promise<SanitizedConfig>
  readonly importMap: ImportMap
  readonly params: Promise<{
    segments: string[]
  }>
  readonly searchParams: Promise<{
    [key: string]: string | string[]
  }>
}) =>
  renderRoot({
    config,
    importMap,
    initReq,
    notFound,
    params,
    redirect,
    routeDataGetter: getRouteData,
    searchParams,
  })
