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

export const RootPage = async (props: PageProps) => (
  <UnmountWhenHidden>
    {await renderRoot({ ...props, adminViews, initAdminContext, notFound, redirect })}
  </UnmountWhenHidden>
)

export const NotFoundPage = async (props: PageProps) => (
  <UnmountWhenHidden>{await renderNotFoundPage({ ...props, initAdminContext })}</UnmountWhenHidden>
)
