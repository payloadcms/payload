import type {
  AdminViewAdapter,
  AdminViewServerProps,
  ImportMap,
  MetaConfig,
  SanitizedConfig,
} from 'payload'

import { renderNotFoundPage } from '@payloadcms/ui/views/NotFound/page'
import { renderRoot } from '@payloadcms/ui/views/Root'
import { defaultAdminViews } from '@payloadcms/ui/views/Root/adminViews'
import { notFound, redirect } from 'next/navigation.js'
import React from 'react'

import { initAdminContext } from '../utilities/initAdminContext.js'
import { UnmountWhenHidden } from './UnmountWhenHidden/index.js'

export const adminViews: AdminViewAdapter<AdminViewServerProps, MetaConfig> = defaultAdminViews

type PageProps = {
  readonly config: Promise<SanitizedConfig>
  readonly importMap: ImportMap
  readonly params: Promise<{
    segments: string[]
  }>
  readonly searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

// Set by `withPayload`. Only with `cacheComponents` does Next.js keep hidden pages mounted.
const isCacheComponentsEnabled = process.env.PAYLOAD_CACHE_COMPONENTS_ENABLED === 'true'

export const RootPage = async (props: PageProps) => {
  const page = await renderRoot({ ...props, adminViews, initAdminContext, notFound, redirect })

  return isCacheComponentsEnabled ? <UnmountWhenHidden>{page}</UnmountWhenHidden> : page
}

export const NotFoundPage = async (props: PageProps) => {
  const page = await renderNotFoundPage({ ...props, initAdminContext })

  return isCacheComponentsEnabled ? <UnmountWhenHidden>{page}</UnmountWhenHidden> : page
}
