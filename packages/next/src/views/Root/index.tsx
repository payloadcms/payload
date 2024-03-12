import type { I18n } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { AdminViewComponent, SanitizedConfig } from 'payload/types'

import { DefaultTemplate, MinimalTemplate } from '@payloadcms/ui'
import { notFound, redirect } from 'next/navigation.js'
import React from 'react'

import { initPage } from '../../utilities/initPage.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'
import { getViewsFromConfig } from './getViewsFromConfig.jsx'

export { generatePageMetadata } from './meta.js'

export type GenerateViewMetadata = (args: {
  config: SanitizedConfig
  i18n: I18n
  params?: { [key: string]: string | string[] }
}) => Promise<Metadata>

export const RootPage = async ({
  config: configPromise,
  params,
  searchParams,
}: {
  config: Promise<SanitizedConfig>
  params: {
    [key: string]: string | string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}) => {
  const config = await configPromise

  const {
    admin: { user: userSlug },
    routes: { admin: adminRoute },
  } = config

  let route = adminRoute

  if (Array.isArray(params.segments)) {
    route = route + '/' + params.segments.join('/')
  }

  const segments = Array.isArray(params.segments) ? params.segments : []

  const { View, initPageOptions, templateClassName, templateType } = getViewsFromConfig({
    adminRoute,
    config,
    route,
    searchParams,
    segments,
  })

  let dbHasUser = false

  // check for custom view
  const ViewToRender: AdminViewComponent = View || getCustomViewByRoute({ config, route })

  if (!ViewToRender) {
    notFound()
  }

  const initPageResult = await initPage(initPageOptions)

  if (initPageResult) {
    dbHasUser = await initPageResult?.req.payload.db
      .findOne({
        collection: userSlug,
        req: initPageResult?.req,
      })
      ?.then((doc) => !!doc)

    const createFirstUserRoute = `${adminRoute}/create-first-user`

    if (!dbHasUser && route !== createFirstUserRoute) {
      redirect(createFirstUserRoute)
    }

    if (dbHasUser && route === createFirstUserRoute) {
      redirect(adminRoute)
    }
  }

  const RenderedView = (
    <ViewToRender initPageResult={initPageResult} params={params} searchParams={searchParams} />
  )

  if (templateType === 'minimal') {
    return <MinimalTemplate className={templateClassName}>{RenderedView}</MinimalTemplate>
  }

  if (templateType === 'default') {
    return (
      <DefaultTemplate
        config={config}
        i18n={initPageResult.req.i18n}
        permissions={initPageResult.permissions}
        user={initPageResult.req.user}
      >
        {RenderedView}
      </DefaultTemplate>
    )
  }

  return RenderedView
}
