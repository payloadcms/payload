import type { I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { ImportMap, SanitizedConfig } from 'payload'

import { renderRoot } from '@payloadcms/ui/views/Root'
import { notFound, redirect } from 'next/navigation.js'

import { initReq } from '../utilities/initReq.js'
import { adminViews } from '../adapters/views.js'

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
    adminViews,
    config,
    importMap,
    initReq: initReq as Parameters<typeof renderRoot>[0]['initReq'],
    notFound,
    params,
    redirect,
    searchParams,
  })
