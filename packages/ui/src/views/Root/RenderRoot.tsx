import type {
  AdminViewClientProps,
  AdminViewServerPropsOnly,
  CollectionPreferences,
  ImportMap,
  InitReqResult,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { applyLocaleFiltering, formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'

import type { ViewComponentRenderer, WithViewRenderer } from '../../utilities/createViewRenderer.js'

import { PageConfigProvider } from '../../providers/Config/index.js'
import { ViewRendererProvider } from '../../providers/ViewRenderer/index.js'
import { DefaultTemplate } from '../../templates/Default/index.js'
import { MinimalTemplate } from '../../templates/Minimal/index.js'
import { createViewRenderer } from '../../utilities/createViewRenderer.js'
import { getClientConfig } from '../../utilities/getClientConfig.js'
import { getPreferences } from '../../utilities/getPreferences.js'
import { getVisibleEntities } from '../../utilities/getVisibleEntities.js'
import { handleAuthRedirect } from '../../utilities/handleAuthRedirect.js'
import { isCustomAdminView } from '../../utilities/isCustomAdminView.js'
import { isPublicAdminRoute } from '../../utilities/isPublicAdminRoute.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'
import { getRouteData } from './getRouteData.js'

export type RenderRootPageArgs = {
  importMap: ImportMap
  initPageResult: InitReqResult
  /** Framework-specific notFound — throws framework error */
  notFound: () => never
  /** Framework-specific redirect — throws framework error */
  redirect: (url: string) => never
  searchParams: { [key: string]: string | string[] }
  segments: string[]
  viewRenderer?: ViewComponentRenderer
}

/**
 * Framework-agnostic root page renderer.
 * Receives a pre-computed initPageResult and navigation callbacks from the framework adapter.
 */
export const renderRootPage = async ({
  importMap,
  initPageResult,
  notFound,
  redirect,
  searchParams,
  segments,
  viewRenderer,
}: RenderRootPageArgs): Promise<React.ReactNode> => {
  const {
    cookies,
    locale,
    permissions,
    req,
    req: { payload },
  } = initPageResult

  const config = payload.config

  const {
    admin: {
      routes: { createFirstUser: _createFirstUserRoute },
      user: userSlug,
    },
    routes: { admin: adminRoute },
  } = config

  const currentRoute = formatAdminURL({
    adminRoute,
    path: Array.isArray(segments) && segments.length > 0 ? `/${segments.join('/')}` : null,
  })

  const isCollectionRoute = segments[0] === 'collections'
  const isGlobalRoute = segments[0] === 'globals'
  let collectionConfig: SanitizedCollectionConfig = undefined
  let globalConfig: SanitizedGlobalConfig = undefined

  // Redirect `${adminRoute}/collections` to `${adminRoute}`
  if (isCollectionRoute) {
    if (segments.length === 1) {
      const { viewKey } = getCustomViewByRoute({
        config,
        currentRoute: '/collections',
      })

      if (!viewKey) {
        redirect(adminRoute)
      }
    }

    if (segments[1]) {
      collectionConfig = config.collections.find(({ slug }) => slug === segments[1])
    }
  }

  // Redirect `${adminRoute}/globals` to `${adminRoute}`
  if (isGlobalRoute) {
    if (segments.length === 1) {
      const { viewKey } = getCustomViewByRoute({
        config,
        currentRoute: '/globals',
      })

      if (!viewKey) {
        redirect(adminRoute)
      }
    }

    if (segments[1]) {
      globalConfig = config.globals.find(({ slug }) => slug === segments[1])
    }
  }

  if ((isCollectionRoute && !collectionConfig) || (isGlobalRoute && !globalConfig)) {
    return notFound()
  }

  if (
    !permissions.canAccessAdmin &&
    !isPublicAdminRoute({ adminRoute, config: payload.config, route: currentRoute }) &&
    !isCustomAdminView({ adminRoute, config: payload.config, route: currentRoute })
  ) {
    redirect(
      handleAuthRedirect({
        config: payload.config,
        route: currentRoute,
        searchParams,
        user: req.user,
      }),
    )
  }

  let collectionPreferences: CollectionPreferences = undefined

  if (collectionConfig && segments.length === 2) {
    if (config.folders && collectionConfig.folders && segments[1] !== config.folders.slug) {
      await getPreferences<CollectionPreferences>(
        `collection-${collectionConfig.slug}`,
        req.payload,
        req.user?.id,
        config.admin.user,
      ).then((res) => {
        if (res && res.value) {
          collectionPreferences = res.value
        }
      })
    }
  }

  const {
    browseByFolderSlugs,
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
    currentRoute,
    globalConfig,
    payload,
    searchParams,
    segments,
  })

  req.routeParams = routeParams

  const dbHasUser =
    req.user ||
    (await req.payload.db
      .findOne({
        collection: userSlug,
        req,
      })
      ?.then((doc) => !!doc))

  if (!DefaultView?.Component && !DefaultView?.payloadComponent) {
    if (req?.user) {
      notFound()
    }

    if (dbHasUser) {
      redirect(adminRoute)
    }
  }

  const usersCollection = config.collections.find(({ slug }) => slug === userSlug)
  const disableLocalStrategy = usersCollection?.auth?.disableLocalStrategy

  const createFirstUserRoute = formatAdminURL({
    adminRoute,
    path: _createFirstUserRoute,
  })

  if (disableLocalStrategy && currentRoute === createFirstUserRoute) {
    redirect(adminRoute)
  }

  if (!dbHasUser && currentRoute !== createFirstUserRoute && !disableLocalStrategy) {
    redirect(createFirstUserRoute)
  }

  if (dbHasUser && currentRoute === createFirstUserRoute) {
    redirect(adminRoute)
  }

  if (!DefaultView?.Component && !DefaultView?.payloadComponent && !dbHasUser) {
    redirect(adminRoute)
  }

  const clientConfig = getClientConfig({
    config,
    i18n: req.i18n,
    importMap,
    user: viewType === 'createFirstUser' ? true : req.user,
  })

  await applyLocaleFiltering({ clientConfig, config, req })

  // Ensure locale on req is still valid after filtering locales
  if (
    clientConfig.localization &&
    req.locale &&
    !clientConfig.localization.localeCodes.includes(req.locale)
  ) {
    redirect(
      `${currentRoute}${qs.stringify(
        {
          ...searchParams,
          locale: clientConfig.localization.localeCodes.includes(
            clientConfig.localization.defaultLocale,
          )
            ? clientConfig.localization.defaultLocale
            : clientConfig.localization.localeCodes[0],
        },
        { addQueryPrefix: true },
      )}`,
    )
  }

  const visibleEntities = getVisibleEntities({ req })

  const folderID = routeParams.folderID

  const params = { segments }
  const resolvedViewRenderer = viewRenderer ?? createViewRenderer({ importMap })
  type RootViewServerProps = {
    notFound: () => never
    payload: typeof req.payload
    redirect: (url: string) => never
    searchParams: { [key: string]: string | string[] }
  } & AdminViewServerPropsOnly &
    WithViewRenderer

  const RenderedView = resolvedViewRenderer({
    clientProps: {
      browseByFolderSlugs,
      clientConfig,
      documentSubViewType,
      viewType,
    } satisfies AdminViewClientProps,
    Component: DefaultView.payloadComponent,
    Fallback: DefaultView.Component,
    serverProps: {
      clientConfig,
      collectionConfig,
      docID: routeParams.id,
      folderID,
      globalConfig,
      i18n: req.i18n,
      importMap,
      initPageResult: {
        collectionConfig,
        cookies,
        docID: routeParams.id,
        globalConfig,
        languageOptions: Object.entries(req.payload.config.i18n.supportedLanguages || {}).reduce(
          (acc, [language, languageConfig]) => {
            if (Object.keys(req.payload.config.i18n.supportedLanguages).includes(language)) {
              acc.push({
                label: languageConfig.translations.general.thisLanguage,
                value: language,
              })
            }

            return acc
          },
          [],
        ),
        locale,
        permissions,
        req,
        translations: req.i18n.translations,
        visibleEntities,
      },
      // Inject framework-specific navigation callbacks so DocumentView and others can use them
      notFound,
      params,
      payload: req.payload,
      redirect,
      searchParams,
      viewActions,
      viewRenderer: resolvedViewRenderer,
    } satisfies RootViewServerProps,
  })

  return (
    <ViewRendererProvider renderer={resolvedViewRenderer}>
      <PageConfigProvider config={clientConfig}>
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
            locale={locale}
            params={params}
            payload={req.payload}
            permissions={permissions}
            req={req}
            searchParams={searchParams}
            user={req.user}
            viewActions={viewActions}
            viewType={viewType}
            visibleEntities={{
              collections: visibleEntities?.collections,
              globals: visibleEntities?.globals,
            }}
          >
            {RenderedView}
          </DefaultTemplate>
        )}
      </PageConfigProvider>
    </ViewRendererProvider>
  )
}
