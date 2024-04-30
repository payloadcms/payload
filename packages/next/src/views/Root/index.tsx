import type { I18n } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload/types'

import { DefaultTemplate } from '@payloadcms/ui/templates/Default'
import { MinimalTemplate } from '@payloadcms/ui/templates/Minimal'
import { notFound, redirect } from 'next/navigation.js'
import React, { Fragment } from 'react'

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

  return (
    <Fragment>
      {templateType === 'none' && RenderedView}
      {templateType === 'minimal' && (
        <MinimalTemplate className={templateClassName}>{RenderedView}</MinimalTemplate>
      )}
      {templateType === 'default' && (
        <DefaultTemplate
          className={templateClassName}
          config={config}
          visibleEntities={initPageResult.visibleEntities}
        >
          {RenderedView}
        </DefaultTemplate>
      )}
    </Fragment>
  )
}
