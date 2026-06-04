import type {
  AdminViewAdapter,
  AdminViewServerProps,
  ImportMap,
  MetaConfig,
  SanitizedConfig,
} from 'payload'

import { initReq } from '@payloadcms/ui/utilities/initReq'
import { renderNotFoundPage } from '@payloadcms/ui/views/NotFound/page'
import { renderRoot } from '@payloadcms/ui/views/Root'
import { defaultAdminViews } from '@payloadcms/ui/views/Root/adminViews'
import { notFound, redirect } from 'next/navigation.js'

import { nextServerAdapter } from './server.js'

const boundInitReq: Parameters<typeof renderRoot>[0]['initReq'] = (args) =>
  initReq({ ...args, serverAdapter: nextServerAdapter })

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

export const RootPage = (props: PageProps) =>
  renderRoot({ ...props, adminViews, initReq: boundInitReq, notFound, redirect })

export const NotFoundPage = (props: PageProps) =>
  renderNotFoundPage({ ...props, initReq: boundInitReq })
