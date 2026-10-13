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
import { connection } from 'next/server.js'

import { initAdminContext } from '../utilities/initAdminContext.js'

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

export const RootPage = async (props: PageProps) => {
  if (process.env.PAYLOAD_CACHE_COMPONENTS_ENABLED === 'true') {
    await connection()
  }

  return renderRoot({ ...props, adminViews, initAdminContext, notFound, redirect })
}

export const NotFoundPage = async (props: PageProps) => {
  if (process.env.PAYLOAD_CACHE_COMPONENTS_ENABLED === 'true') {
    await connection()
  }

  return renderNotFoundPage({ ...props, initAdminContext })
}
