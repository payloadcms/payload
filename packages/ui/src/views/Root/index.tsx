'use server'

import type {
  AdminViewAdapter,
  AdminViewClientProps,
  AdminViewServerPropsOnly,
  CollectionPreferences,
  createPayloadReq,
  GetAdminContextResult,
  ImportMap,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { applyLocaleFiltering, formatAdminURL, stripTrailingSlash } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds
import { PageConfigProvider } from '../../exports/client/index.js'
import { DefaultTemplate } from '../../templates/Default/index.js'
import { MinimalTemplate } from '../../templates/Minimal/index.js'
import { getClientConfig } from '../../utilities/getClientConfig.js'
import { getPreferences } from '../../utilities/getPreferences.js'
import { getVisibleEntities } from '../../utilities/getVisibleEntities.js'
import { handleAuthRedirect } from '../../utilities/handleAuthRedirect.js'
import { isCustomAdminView } from '../../utilities/isCustomAdminView.js'
import { isPublicAdminRoute } from '../../utilities/isPublicAdminRoute.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'
import { getRouteData } from './getRouteData.js'

export type GetAdminContextFn = (args: {
  canSetHeaders?: boolean
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  key: string
  overrides?: Omit<Parameters<typeof createPayloadReq>[0], 'payload'>
}) => Promise<GetAdminContextResult>

export type RenderRootArgs = {
  adminViews: AdminViewAdapter
  config: Promise<SanitizedConfig>
  getAdminContext: GetAdminContextFn
  importMap: ImportMap
  /**
   * Optional React `key` applied to the rendered view (not the surrounding admin
   * template/nav). Adapters whose router reconciles a single RSC payload in place
   * across navigations (e.g. TanStack Start) pass a per-route key here so the
   * *view* remounts on route change — resetting view-scoped client providers like
   * `DocumentInfoProvider` that hold uncontrolled `useState` from the prior
   * document — while the persistent nav/template reconciles in place (no flash).
   * Left `undefined` by Next.js, whose App Router already remounts the page
   * segment while its layout (nav) persists.
   */
  key?: string
  /** Framework notFound implementation (e.g. next/navigation notFound). Called before req is available. */
  notFound: () => never
  params: Promise<{ segments: string[] }>
  /** Framework redirect implementation (e.g. next/navigation redirect). Called before req is available. */
  redirect: (url: string) => never
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const renderRoot = async ({
  adminViews,
  config: configPromise,
  getAdminContext,
  importMap,
  key,
  notFound,
  params: paramsPromise,
  redirect,
  searchParams: searchParamsPromise,
}: RenderRootArgs) => {
  const config = await configPromise

  const {
    admin: {
      routes: { createFirstUser: _createFirstUserRoute },
      user: userSlug,
    },
    routes: { admin: adminRoute },
  } = config
  const adminRouteURL = formatAdminURL({ adminRoute })

  const params = await paramsPromise

  // route with possible trailing slash
  const currentRouteURL = formatAdminURL({
    adminRoute,
    path: Array.isArray(params.segments) ? `/${params.segments.join('/')}` : null,
  })
  // route without possible trailing slash
  const currentRouteToCompare = stripTrailingSlash(currentRouteURL)

  const segments = Array.isArray(params.segments) ? params.segments : []
  const isCollectionRoute = segments[0] === 'collections'
  const isGlobalRoute = segments[0] === 'globals'
  let collectionConfig: SanitizedCollectionConfig = undefined
  let globalConfig: SanitizedGlobalConfig = undefined

  const searchParams = await searchParamsPromise

  // Redirect `${adminRoute}/collections` to `${adminRoute}`
  if (isCollectionRoute) {
    if (segments.length === 1) {
      const { viewKey } = getCustomViewByRoute({
        config,
        currentRoute: '/collections',
      })

      // Only redirect if there's NO custom view configured for /collections
      if (!viewKey) {
        redirect(adminRouteURL)
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

      // Only redirect if there's NO custom view configured for /globals
      if (!viewKey) {
        redirect(adminRouteURL)
      }
    }

    if (segments[1]) {
      globalConfig = config.globals.find(({ slug }) => slug === segments[1])
    }
  }

  if ((isCollectionRoute && !collectionConfig) || (isGlobalRoute && !globalConfig)) {
    notFound()
  }

  const queryString = `${qs.stringify(searchParams ?? {}, { addQueryPrefix: true })}`

  const {
    cookies,
    locale,
    permissions,
    req,
    req: { payload },
    user,
  } = await getAdminContext({
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
      // intentionally omit `serverURL` to keep URL relative
      urlSuffix: `${currentRouteURL}${searchParams ? queryString : ''}`,
    },
  })

  if (
    !permissions.canAccessAdmin &&
    !isPublicAdminRoute({ adminRoute, config: payload.config, route: currentRouteToCompare }) &&
    !isCustomAdminView({ adminRoute, config: payload.config, route: currentRouteToCompare })
  ) {
    req.server.redirect(
      handleAuthRedirect({
        config: payload.config,
        route: currentRouteToCompare,
        searchParams,
        user: req.user,
      }),
    )
  }

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
    adminViews,
    collectionConfig,
    collectionPreferences,
    currentRoute: currentRouteToCompare,
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

  /**
   * This function is responsible for handling the case where the view is not found.
   * The current route did not match any default views or custom route views.
   */
  if (!DefaultView?.Component && !DefaultView?.payloadComponent) {
    if (req?.user) {
      req.server.notFound()
    }

    if (dbHasUser) {
      req.server.redirect(adminRouteURL)
    }
  }

  const usersCollection = config.collections.find(({ slug }) => slug === userSlug)
  const disableLocalStrategy = usersCollection?.auth?.disableLocalStrategy

  const createFirstUserURL = formatAdminURL({
    adminRoute,
    path: _createFirstUserRoute,
  })
  const createFirstUserRouteToCompare = stripTrailingSlash(createFirstUserURL)

  if (disableLocalStrategy && currentRouteToCompare === createFirstUserRouteToCompare) {
    req.server.redirect(adminRouteURL)
  }

  if (
    !dbHasUser &&
    currentRouteToCompare !== createFirstUserRouteToCompare &&
    !disableLocalStrategy
  ) {
    req.server.redirect(createFirstUserURL)
  }

  if (dbHasUser && currentRouteToCompare === createFirstUserRouteToCompare) {
    req.server.redirect(adminRouteURL)
  }

  if (!DefaultView?.Component && !DefaultView?.payloadComponent && !dbHasUser) {
    req.server.redirect(adminRouteURL)
  }

  const clientConfig = getClientConfig({
    config,
    i18n: req.i18n,
    importMap,
    user: viewType === 'createFirstUser' ? true : user,
  })

  await applyLocaleFiltering({ clientConfig, config, req })

  // Ensure locale on req is still valid after filtering locales
  if (
    clientConfig.localization &&
    req.locale &&
    !clientConfig.localization.localeCodes.includes(req.locale)
  ) {
    req.server.redirect(
      `${currentRouteURL}${qs.stringify(
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

  const RenderedView = RenderServerComponent({
    clientProps: {
      clientConfig,
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
      clientConfig,
      collectionConfig,
      docID: routeParams.id,
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
      params,
      payload: req.payload,
      searchParams,
      server: req.server,
      user,
      viewActions,
    } satisfies AdminViewServerPropsOnly,
  })

  // Wrap the view in a keyed boundary so it remounts on route change while the
  // surrounding template/nav reconciles in place. `key={undefined}` (Next.js) is
  // a no-op, preserving prior behavior.
  const KeyedView = <React.Fragment key={key}>{RenderedView}</React.Fragment>

  return (
    <PageConfigProvider config={clientConfig}>
      {!templateType && <React.Fragment>{KeyedView}</React.Fragment>}
      {templateType === 'minimal' && (
        <MinimalTemplate className={templateClassName}>{KeyedView}</MinimalTemplate>
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
          user={user}
          viewActions={viewActions}
          viewKey={key}
          viewType={viewType}
          visibleEntities={{
            // The reason we are not passing in initPageResult.visibleEntities directly is due to a "Cannot assign to read only property of object '#<Object>" error introduced in React 19
            // which this caused as soon as initPageResult.visibleEntities is passed in
            collections: visibleEntities?.collections,
            globals: visibleEntities?.globals,
          }}
        >
          {KeyedView}
        </DefaultTemplate>
      )}
    </PageConfigProvider>
  )
}
