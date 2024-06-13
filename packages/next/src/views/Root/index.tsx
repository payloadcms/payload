import type { I18n } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { SanitizedConfig } from 'payload'

import { WithServerSideProps } from '@payloadcms/ui/shared'
import { notFound, redirect } from 'next/navigation.js'
import React, { Fragment } from 'react'

import { DefaultTemplate } from '../../templates/Default/index.js'
import { MinimalTemplate } from '../../templates/Minimal/index.js'
import { initPage } from '../../utilities/initPage/index.js'
import { getViewFromConfig } from './getViewFromConfig.js'

export { generatePageMetadata } from './meta.js'

export type GenerateViewMetadata = (args: {
  config: SanitizedConfig
  i18n: I18n
  isEditing?: boolean
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
    admin: {
      routes: { createFirstUser: createFirstUserRoute },
      user: userSlug,
    },
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

    const routeWithAdmin = `${adminRoute}${createFirstUserRoute}`

    if (!dbHasUser && currentRoute !== routeWithAdmin) {
      redirect(routeWithAdmin)
    }

    if (dbHasUser && currentRoute === routeWithAdmin) {
      redirect(adminRoute)
    }
  }

  const RenderedView = (
    <WithServerSideProps
      Component={DefaultView}
      serverOnlyProps={
        {
          initPageResult,
          params,
          searchParams,
        } as any
      }
    />
  )

  return (
    <Fragment>
      {!templateType && <Fragment>{RenderedView}</Fragment>}
      {templateType === 'minimal' && (
        <MinimalTemplate className={templateClassName}>{RenderedView}</MinimalTemplate>
      )}
      {templateType === 'default' && (
        <DefaultTemplate
          i18n={initPageResult?.req.i18n}
          locale={initPageResult?.locale}
          params={params}
          payload={initPageResult?.req.payload}
          permissions={initPageResult?.permissions}
          searchParams={searchParams}
          user={initPageResult?.req.user}
          visibleEntities={{
            // The reason we are not passing in initPageResult.visibleEntities directly is due to a "Cannot assign to read only property of object '#<Object>" error introduced in React 19
            // which this caused as soon as initPageResult.visibleEntities is passed in
            collections: initPageResult.visibleEntities?.collections,
            globals: initPageResult.visibleEntities?.globals,
          }}
        >
          {RenderedView}
        </DefaultTemplate>
      )}
    </Fragment>
  )
}
