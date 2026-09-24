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

import { initReq } from '../utilities/initReq.js'

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
  renderRoot({ ...props, adminViews, initReq, notFound, redirect })

export const NotFoundPage = (props: PageProps) => renderNotFoundPage({ ...props, initReq })
