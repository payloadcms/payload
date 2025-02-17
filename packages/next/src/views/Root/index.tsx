import type { I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { ImportMap, InitPageResult, SanitizedConfig } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { formatAdminURL } from '@payloadcms/ui/shared'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { notFound, redirect } from 'next/navigation.js'
import React, { Fragment, Suspense } from 'react'

import { DefaultTemplate } from '../../templates/Default/index.js'
import { DefaultTemplateLoading } from '../../templates/Default/Loading.js'
import { MinimalTemplate } from '../../templates/Minimal/index.js'
import { initPage } from '../../utilities/initPage/index.js'
import { getViewFromConfig, type GetViewFromConfigResult } from './getViewFromConfig.js'

export { generatePageMetadata } from './meta.js'

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
    path: `${Array.isArray(params.segments) ? `/${params.segments.join('/')}` : ''}`,
  })

  const segments = Array.isArray(params.segments) ? params.segments : []

  const searchParams = await searchParamsPromise

  const getViewFromConfigResult = getViewFromConfig({
    adminRoute,
    config,
    currentRoute,
    importMap,
    searchParams,
    segments,
  })
  const {
    DefaultView,
    documentSubViewType,
    initPageOptions,
    serverProps,
    templateClassName,
    templateType,
    viewType,
  } = getViewFromConfigResult

  const rootPageProps: BaseRootPageWithDataProps = {
    _createFirstUserRoute,
    adminRoute,
    config,
    currentRoute,
    getViewFromConfigResult,
    importMap,
    params,
    searchParams,
    userSlug,
  }

  return (
    <Fragment>
      {!templateType && (
        <Suspense key={`main-view-${currentRoute}`}>
          <RootPageWithData {...rootPageProps} />
        </Suspense>
      )}
      {templateType === 'minimal' && (
        <MinimalTemplate className={templateClassName}>
          <Suspense key={`main-view-${currentRoute}`}>
            <RootPageWithData {...rootPageProps} />
          </Suspense>
        </MinimalTemplate>
      )}
      {templateType === 'default' && (
        <Suspense
          fallback={
            <RootPageWithDefaultTemplateFallback
              currentRoute={currentRoute}
              getViewFromConfigResult={{
                DefaultView,
                documentSubViewType,
                initPageOptions,
                serverProps,
                templateClassName,
                templateType,
                viewType,
              }}
              params={params}
              rootPageProps={rootPageProps}
              searchParams={searchParams}
            />
          }
          key={`main-view-${currentRoute}`}
        >
          <RootPageWithDefaultTemplate
            currentRoute={currentRoute}
            getViewFromConfigResult={{
              DefaultView,
              documentSubViewType,
              initPageOptions,
              serverProps,
              templateClassName,
              templateType,
              viewType,
            }}
            params={params}
            rootPageProps={rootPageProps}
            searchParams={searchParams}
          />
        </Suspense>
      )}
    </Fragment>
  )
}

const RootPageWithDefaultTemplateFallback: React.FC<{
  currentRoute: string
  getViewFromConfigResult: GetViewFromConfigResult
  params: { [key: string]: string | string[] }
  rootPageProps: Omit<BaseRootPageWithDataProps, 'initPageResult'>
  searchParams: { [key: string]: string | string[] }
}> = (args) => {
  const {
    currentRoute,
    getViewFromConfigResult: { documentSubViewType, initPageOptions, serverProps, viewType },
    params,
    rootPageProps,
    searchParams,
  } = args

  return (
    <DefaultTemplateLoading>
      <Suspense key={`main-view-${currentRoute}`}>
        <RootPageWithData {...rootPageProps} />
      </Suspense>
    </DefaultTemplateLoading>
  )
}

const RootPageWithDefaultTemplate: React.FC<{
  currentRoute: string
  getViewFromConfigResult: GetViewFromConfigResult
  params: { [key: string]: string | string[] }
  rootPageProps: Omit<BaseRootPageWithDataProps, 'initPageResult'>
  searchParams: { [key: string]: string | string[] }
}> = async (args) => {
  const {
    currentRoute,
    getViewFromConfigResult: { documentSubViewType, initPageOptions, serverProps, viewType },
    params,
    rootPageProps,
    searchParams,
  } = args

  const initPageResult = await initPage(initPageOptions)

  return (
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
      <Suspense key={`main-view-${currentRoute}`}>
        <RootPageWithData {...rootPageProps} />
      </Suspense>
    </DefaultTemplate>
  )
}

type BaseRootPageWithDataProps = {
  _createFirstUserRoute: string
  adminRoute: string
  config: SanitizedConfig
  currentRoute: string
  getViewFromConfigResult: GetViewFromConfigResult
  importMap: ImportMap
  initPageResult?: InitPageResult | Promise<InitPageResult>
  params: { [key: string]: string | string[] }
  searchParams: { [key: string]: string | string[] }
  userSlug: string
}

const RootPageWithData: React.FC<BaseRootPageWithDataProps> = async (args) => {
  const {
    _createFirstUserRoute,
    adminRoute,
    config,
    currentRoute,
    getViewFromConfigResult: {
      DefaultView,
      documentSubViewType,
      initPageOptions,
      serverProps,
      viewType,
    },
    importMap,
    params,
    searchParams,
    userSlug,
  } = args

  const initPageResult = (await args?.initPageResult) ?? (await initPage(initPageOptions))

  const dbHasUser =
    initPageResult.req.user ||
    (await initPageResult?.req.payload.db
      .findOne({
        collection: userSlug,
        req: initPageResult?.req,
      })
      ?.then((doc) => !!doc))

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

  const RenderedView = RenderServerComponent({
    clientProps: { clientConfig, documentSubViewType, viewType },
    Component: DefaultView.payloadComponent,
    Fallback: DefaultView.Component,
    importMap,
    serverProps: {
      ...serverProps,
      clientConfig,
      docID: initPageResult?.docID,
      i18n: initPageResult?.req.i18n,
      importMap,
      initPageResult,
      params,
      payload: initPageResult?.req.payload,
      searchParams,
    },
  })

  return RenderedView
}
