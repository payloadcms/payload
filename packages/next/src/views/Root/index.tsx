import type { AcceptedLanguages, I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type {
  AdminViewClientProps,
  AdminViewServerPropsOnly,
  CollectionPreferences,
  ImportMap,
  LanguageOptions,
  SanitizedConfig,
} from 'payload'

import { PageConfigProvider } from '@payloadcms/ui'
import { getRootViewData } from '@payloadcms/ui/views/Root/getRootViewData'
import { notFound, redirect } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { DefaultTemplate } from '../../templates/Default/index.js'
import { MinimalTemplate } from '@payloadcms/ui/templates/Minimal'
import { getPreferences } from '../../utilities/getPreferences.js'
import { initReq } from '../../utilities/initReq.js'
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
  const params = await paramsPromise
  const searchParams = await searchParamsPromise

  const {
    routes: { admin: adminRoute },
  } = config

  const segments = Array.isArray(params.segments) ? params.segments : []

  const currentRoute = formatAdminURL({
    adminRoute,
    path: segments.length ? `/${segments.join('/')}` : null,
  })
  const queryString = qs.stringify(searchParams ?? {}, { addQueryPrefix: true })

  const initResult = await initReq({
    configPromise: config,
    importMap,
    key: 'initPage',
    overrides: {
      fallbackLocale: false,
      req: {
        query: qs.parse(queryString, {
          depth: 10,
          ignoreQueryPrefix: true,
        }),
      },
      urlSuffix: `${currentRoute}${searchParams ? queryString : ''}`,
    },
  })

  let rootData: Awaited<ReturnType<typeof getRootViewData>>

  try {
    rootData = await getRootViewData({
      config,
      importMap,
      initResult,
      params,
      searchParams,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'not-found') {
      return notFound()
    }

    throw error
  }

  if (rootData.redirect) {
    redirect(rootData.redirect)
  }

  const { collectionConfig, globalConfig, req } = rootData

  let collectionPreferences: CollectionPreferences = undefined

  if (collectionConfig && segments.length === 2) {
    await getPreferences<CollectionPreferences>(
      `collection-${collectionConfig.slug}`,
      req.payload,
      req.user.id,
      config.admin.user,
    ).then((res) => {
      if (res && res.value) {
        collectionPreferences = res.value
      }
    })
  }

  const {
    DefaultView,
    documentSubViewType,
    routeParams,
    templateClassName,
    templateType,
    viewActions,
    viewType,
  } = getRouteData({
    adminRoute,
    collectionConfig,
    collectionPreferences,
    currentRoute: rootData.currentRoute,
    globalConfig,
    payload: req.payload,
    searchParams,
    segments,
  })

  req.routeParams = routeParams

  if (!DefaultView?.Component && !DefaultView?.payloadComponent) {
    if (req?.user) {
      notFound()
    }

    if (rootData.dbHasUser) {
      redirect(adminRoute)
    }
  }

  if (!DefaultView?.Component && !DefaultView?.payloadComponent && !rootData.dbHasUser) {
    redirect(adminRoute)
  }

  const RenderedView = RenderServerComponent({
    clientProps: {
      clientConfig: rootData.clientConfig,
      collectionSlug: collectionConfig?.slug,
      docID: routeParams.id,
      documentSubViewType,
      globalSlug: globalConfig?.slug,
      viewType,
    } satisfies AdminViewClientProps,
    Component: DefaultView.payloadComponent,
    Fallback: DefaultView.Component,
    importMap,
    serverProps: {
      clientConfig: rootData.clientConfig,
      collectionConfig,
      docID: routeParams.id,
      globalConfig,
      i18n: req.i18n,
      importMap,
      initPageResult: {
        collectionConfig,
        cookies: rootData.cookies,
        docID: routeParams.id,
        globalConfig,
        languageOptions: Object.entries(req.payload.config.i18n.supportedLanguages || {}).reduce(
          (acc, [language, languageConfig]) => {
            if (Object.keys(req.payload.config.i18n.supportedLanguages).includes(language)) {
              acc.push({
                label: languageConfig.translations.general.thisLanguage,
                value: language as AcceptedLanguages,
              })
            }

            return acc
          },
          [] as LanguageOptions,
        ),
        locale: rootData.locale,
        permissions: rootData.permissions,
        req,
        translations: req.i18n.translations,
        visibleEntities: rootData.visibleEntities,
      },
      params,
      payload: req.payload,
      renderComponent: RenderServerComponent,
      searchParams,
      viewActions,
    } satisfies AdminViewServerPropsOnly,
  })

  return (
    <PageConfigProvider config={rootData.clientConfig}>
      {!templateType && <React.Fragment>{RenderedView}</React.Fragment>}
      {templateType === 'minimal' && (
        <MinimalTemplate className={templateClassName}>{RenderedView}</MinimalTemplate>
      )}
      {templateType === 'default' && (
        <DefaultTemplate
          collectionSlug={collectionConfig?.slug}
          docID={routeParams.id}
          documentSubViewType={documentSubViewType}
          globalSlug={globalConfig?.slug}
          i18n={req.i18n}
          locale={rootData.locale}
          params={params}
          payload={req.payload}
          permissions={rootData.permissions}
          req={req}
          searchParams={searchParams}
          user={req.user}
          viewActions={viewActions}
          viewType={viewType}
          visibleEntities={{
            collections: rootData.visibleEntities?.collections,
            globals: rootData.visibleEntities?.globals,
          }}
        >
          {RenderedView}
        </DefaultTemplate>
      )}
    </PageConfigProvider>
  )
}
