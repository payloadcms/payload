import type { I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { notFound, redirect } from 'next/navigation.js'
import {
  type AdminViewClientProps,
  type AdminViewServerPropsOnly,
  type ImportMap,
  parseDocumentID,
  type SanitizedConfig,
} from 'payload'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { DefaultTemplate } from '../../templates/Default/index.js'
import { MinimalTemplate } from '../../templates/Minimal/index.js'
import { initPage } from '../../utilities/initPage/index.js'
import { getRouteData } from './getRouteData.js'

export type GenerateViewMetadata = (args: {
  config: SanitizedConfig
  i18n: I18nClient
  isEditing?: boolean
  params?: { [key: string]: string | string[] }
}) => Promise<Metadata>

export const RootPage = async ({
  config: configPromise,
  importMap,
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  readonly config: Promise<SanitizedConfig>
  readonly importMap: ImportMap
  readonly params: Promise<{
    segments: string[]
  }>
  readonly searchParams: Promise<{
    [key: string]: string | string[]
  }>
}) => {
  const config = await configPromise

  const {
    admin: {
      routes: { createFirstUser: _createFirstUserRoute },
      user: userSlug,
    },
    routes: { admin: adminRoute },
  } = config

  const params = await paramsPromise

  const currentRoute = formatAdminURL({
    adminRoute,
    path: Array.isArray(params.segments) ? `/${params.segments.join('/')}` : null,
  })

  const segments = Array.isArray(params.segments) ? params.segments : []

  const searchParams = await searchParamsPromise

  const {
    browseByFolderSlugs,
    DefaultView,
    documentSubViewType,
    folderID: folderIDParam,
    initPageOptions,
    serverProps,
    templateClassName,
    templateType,
    viewType,
  } = getRouteData({
    adminRoute,
    config,
    currentRoute,
    importMap,
    searchParams,
    segments,
  })

  const initPageResult = await initPage(initPageOptions)

  const dbHasUser =
    initPageResult.req.user ||
    (await initPageResult?.req.payload.db
      .findOne({
        collection: userSlug,
        req: initPageResult?.req,
      })
      ?.then((doc) => !!doc))

  /**
   * This function is responsible for handling the case where the view is not found.
   * The current route did not match any default views or custom route views.
   */
  if (!DefaultView?.Component && !DefaultView?.payloadComponent) {
    if (initPageResult?.req?.user) {
      notFound()
    }

    if (dbHasUser) {
      redirect(adminRoute)
    }
  }

  if (typeof initPageResult?.redirectTo === 'string') {
    redirect(initPageResult.redirectTo)
  }

  if (initPageResult) {
    const createFirstUserRoute = formatAdminURL({ adminRoute, path: _createFirstUserRoute })

    const collectionConfig = config.collections.find(({ slug }) => slug === userSlug)
    const disableLocalStrategy = collectionConfig?.auth?.disableLocalStrategy

    if (disableLocalStrategy && currentRoute === createFirstUserRoute) {
      redirect(adminRoute)
    }

    if (!dbHasUser && currentRoute !== createFirstUserRoute && !disableLocalStrategy) {
      redirect(createFirstUserRoute)
    }

    if (dbHasUser && currentRoute === createFirstUserRoute) {
      redirect(adminRoute)
    }
  }

  if (!DefaultView?.Component && !DefaultView?.payloadComponent && !dbHasUser) {
    redirect(adminRoute)
  }

  const clientConfig = getClientConfig({
    config,
    i18n: initPageResult?.req.i18n,
    importMap,
  })

  const payload = initPageResult?.req.payload
  const folderID = payload.config.folders
    ? parseDocumentID({
        id: folderIDParam,
        collectionSlug: payload.config.folders.slug,
        payload,
      })
    : undefined

  const RenderedView = RenderServerComponent({
    clientProps: {
      browseByFolderSlugs,
      clientConfig,
      documentSubViewType,
      viewType,
    } satisfies AdminViewClientProps,
    Component: DefaultView.payloadComponent,
    Fallback: DefaultView.Component,
    importMap,
    serverProps: {
      ...serverProps,
      clientConfig,
      docID: initPageResult?.docID,
      folderID,
      i18n: initPageResult?.req.i18n,
      importMap,
      initPageResult,
      params,
      payload: initPageResult?.req.payload,
      searchParams,
    } satisfies AdminViewServerPropsOnly,
  })

  return (
    <React.Fragment>
      {!templateType && <React.Fragment>{RenderedView}</React.Fragment>}
      {templateType === 'minimal' && (
        <MinimalTemplate className={templateClassName}>{RenderedView}</MinimalTemplate>
      )}
      {templateType === 'default' && (
        <DefaultTemplate
          collectionSlug={initPageResult?.collectionConfig?.slug}
          docID={initPageResult?.docID}
          documentSubViewType={documentSubViewType}
          globalSlug={initPageResult?.globalConfig?.slug}
          i18n={initPageResult?.req.i18n}
          locale={initPageResult?.locale}
          params={params}
          payload={initPageResult?.req.payload}
          permissions={initPageResult?.permissions}
          req={initPageResult?.req}
          searchParams={searchParams}
          user={initPageResult?.req.user}
          viewActions={serverProps.viewActions}
          viewType={viewType}
          visibleEntities={{
            // The reason we are not passing in initPageResult.visibleEntities directly is due to a "Cannot assign to read only property of object '#<Object>" error introduced in React 19
            // which this caused as soon as initPageResult.visibleEntities is passed in
            collections: initPageResult?.visibleEntities?.collections,
            globals: initPageResult?.visibleEntities?.globals,
          }}
        >
          {RenderedView}
        </DefaultTemplate>
      )}
    </React.Fragment>
  )
}
