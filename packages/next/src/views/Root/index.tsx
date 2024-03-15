import type { I18n } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import { DefaultTemplate, MinimalTemplate } from '@payloadcms/ui'
import { notFound, redirect } from 'next/navigation.js'
import React from 'react'

import { initPage } from '../../utilities/initPage.js'
import { getViewFromConfig } from './getViewFromConfig.js'

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
    segments: string[]
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

  const currentRoute = `${adminRoute}${Array.isArray(params.segments) ? `/${params.segments.join('/')}` : ''}`

  const segments = Array.isArray(params.segments) ? params.segments : []

  const { DefaultView, initPageOptions, templateClassName, templateType } = getViewFromConfig({
    adminRoute,
    config,
    currentRoute,
    searchParams,
    segments,
  })

  let dbHasUser = false

  if (!DefaultView) {
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

    if (!dbHasUser && currentRoute !== createFirstUserRoute) {
      redirect(createFirstUserRoute)
    }

    if (dbHasUser && currentRoute === createFirstUserRoute) {
      redirect(adminRoute)
    }
  }

  const RenderedView = (
    <DefaultView initPageResult={initPageResult} params={params} searchParams={searchParams} />
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
