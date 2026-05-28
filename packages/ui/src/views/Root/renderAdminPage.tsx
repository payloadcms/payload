import type { AcceptedLanguages } from '@payloadcms/translations'
import type {
  ClientConfig,
  CollectionPreferences,
  DocumentSubViewTypes,
  ImportMap,
  InitReqResult,
  LanguageOptions,
  SanitizedConfig,
  ViewTypes,
} from 'payload'

import React from 'react'

import { PageConfigProvider } from '../../providers/Config/index.js'
import { DefaultTemplateServer } from '../../templates/Default/Server.js'
import { MinimalTemplate } from '../../templates/Minimal/index.js'
import { getPreferences } from '../../utilities/getPreferences.js'
import { getRootViewData } from './getRootViewData.js'
import { getRouteData } from './getRouteData.js'
import { renderAdminView } from './renderAdminView.js'

export type AdminPageMetadata = {
  /** Resolved client config — needed for `meta.titleSuffix` lookups. */
  clientConfig?: ClientConfig
  /** Resolved collection label (already translated) if route is a collection list/doc. */
  collectionLabel?: string
  /** Document sub-view type (e.g. `versions`, `version`) if applicable. */
  documentSubViewType?: DocumentSubViewTypes
  /** Resolved global label (already translated) if route is a global doc. */
  globalLabel?: string
  /** Resolved view type — used by adapter `head`/`meta` builders. */
  viewType?: ViewTypes
}

export type RenderAdminPageArgs = {
  config: SanitizedConfig
  importMap: ImportMap
  /**
   * Pre-initialized request object. Adapters call their own framework-specific
   * `initReq` (Next: `next/headers`-based; TanStack: request-context-based)
   * and pass the result here.
   */
  initResult: InitReqResult
  /**
   * Optional out-parameter the adapter can read after rendering to build a
   * sidecar metadata object (e.g. for TanStack's `head()` / Next's
   * `generateMetadata`). Mutated synchronously inside `renderAdminPage`
   * once route data has been resolved.
   */
  metadata?: AdminPageMetadata
  params: { segments: string[] }
  searchParams: { [key: string]: string | string[] }
}

/**
 * Framework-agnostic admin page renderer — single entry point that mirrors
 * what `packages/next/src/admin/RootPage.tsx` used to do inline.
 *
 * Steps:
 *  1. Resolve root data (`getRootViewData`).
 *  2. Resolve collection preferences for folder/list detection.
 *  3. Resolve route data (`getRouteData`).
 *  4. Dispatch to the right view RSC (`renderAdminView`).
 *  5. Wrap in `PageConfigProvider` + appropriate template chrome.
 *
 * Throws:
 *  - `Error('not-found')`        → adapter translates to native 404
 *  - `Error('redirect:<url>')`   → adapter translates to native redirect
 *
 * The adapter is responsible for:
 *  - Calling its own `initReq` (Next or TanStack)
 *  - Calling `renderAdminPage` (this)
 *  - Catching the error contract and translating to native navigation
 *  - In TanStack's case, piping the returned React node through `renderServerComponent`
 *    to produce an RSC Flight payload.
 */
export const renderAdminPage = async ({
  config,
  importMap,
  initResult,
  metadata,
  params,
  searchParams,
}: RenderAdminPageArgs): Promise<React.ReactNode> => {
  const {
    routes: { admin: adminRoute },
  } = config

  const segments = Array.isArray(params.segments) ? params.segments : []

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
      throw new Error('not-found')
    }
    throw error
  }

  if (rootData.redirect) {
    throw new Error(`redirect:${rootData.redirect}`)
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

  const routeData = getRouteData({
    adminRoute,
    collectionConfig,
    collectionPreferences,
    currentRoute: rootData.currentRoute,
    globalConfig,
    payload: req.payload,
    searchParams,
    segments,
  })

  req.routeParams = routeData.routeParams

  if (metadata) {
    metadata.clientConfig = rootData.clientConfig
    metadata.documentSubViewType = routeData.documentSubViewType
    metadata.viewType = routeData.viewType
    if (collectionConfig) {
      const label = collectionConfig.labels?.singular ?? collectionConfig.slug
      metadata.collectionLabel = typeof label === 'string' ? label : undefined
    }
    if (globalConfig) {
      const label = globalConfig.label ?? globalConfig.slug
      metadata.globalLabel = typeof label === 'string' ? label : undefined
    }
  }

  if (!routeData.hasView && !routeData.customViewComponent) {
    if (req?.user) {
      throw new Error('not-found')
    }
    throw new Error(`redirect:${adminRoute}`)
  }

  const initPageResult = {
    collectionConfig,
    cookies: rootData.cookies,
    docID: routeData.routeParams.id,
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
  }

  const RenderedView = await renderAdminView({
    clientConfig: rootData.clientConfig,
    importMap,
    initPageResult,
    params,
    routeData,
    searchParams,
  })

  const {
    documentSubViewType,
    routeParams,
    templateClassName,
    templateType,
    viewActions,
    viewType,
  } = routeData

  return (
    <PageConfigProvider config={rootData.clientConfig}>
      {!templateType && <React.Fragment>{RenderedView}</React.Fragment>}
      {templateType === 'minimal' && (
        <MinimalTemplate className={templateClassName}>{RenderedView}</MinimalTemplate>
      )}
      {templateType === 'default' && (
        <DefaultTemplateServer
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
        </DefaultTemplateServer>
      )}
    </PageConfigProvider>
  )
}
