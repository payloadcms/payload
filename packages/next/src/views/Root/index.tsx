import type { I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type {
  AdminViewClientProps,
  AdminViewServerPropsOnly,
  ImportMap,
  SanitizedConfig,
} from 'payload'

import { FolderProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { notFound, redirect } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { initPage } from '../../utilities/initPage/index.js'
import { getRouteData } from './getRouteData.js'
import { RootViewComponent } from './RootViewComponent.js'

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
    DefaultView,
    documentSubViewType,
    folderID,
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

  const sharedServerProps = {
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
  }

  if (viewType === 'collection-folders') {
    const RenderedView = RenderServerComponent({
      clientProps: { clientConfig, documentSubViewType, viewType } satisfies AdminViewClientProps,
      Component: DefaultView.payloadComponent,
      Fallback: DefaultView.Component,
      importMap,
      serverProps: sharedServerProps,
    })

    return (
      <FolderProvider collectionSlugs={[initPageResult?.collectionConfig.slug]}>
        <RootViewComponent
          documentSubViewType={documentSubViewType}
          initPageResult={initPageResult}
          params={params}
          RenderedView={RenderedView}
          searchParams={searchParams}
          serverProps={serverProps}
          templateClassName={templateClassName}
          templateType={templateType}
          viewType={viewType}
        />
      </FolderProvider>
    )
  } else {
    const RenderedView = RenderServerComponent({
      clientProps: { clientConfig, documentSubViewType, viewType } satisfies AdminViewClientProps,
      Component: DefaultView.payloadComponent,
      Fallback: DefaultView.Component,
      importMap,
      serverProps: sharedServerProps satisfies AdminViewServerPropsOnly,
    })
    return (
      <RootViewComponent
        documentSubViewType={documentSubViewType}
        initPageResult={initPageResult}
        params={params}
        RenderedView={RenderedView}
        searchParams={searchParams}
        serverProps={serverProps}
        templateClassName={templateClassName}
        templateType={templateType}
        viewType={viewType}
      />
    )
  }
}
