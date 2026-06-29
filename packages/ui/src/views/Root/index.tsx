'use server'

import type {
  AdminViewAdapter,
  AdminViewClientProps,
  AdminViewServerPropsOnly,
  CollectionPreferences,
  createLocalReq,
  ImportMap,
  InitReqResult,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { applyLocaleFiltering, formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds
import { PageConfigProvider } from '../../exports/client/index.js'
import { NestProviders } from '../../layouts/Root/NestProviders.js'
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

type InitReqFn = (args: {
  canSetHeaders?: boolean
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  key: string
  overrides?: Parameters<typeof createLocalReq>[0]
}) => Promise<InitReqResult>

export type RenderRootArgs = {
  adminViews: AdminViewAdapter
  config: Promise<SanitizedConfig>
  importMap: ImportMap
  initReq: InitReqFn
  /** Framework notFound implementation (e.g. next/navigation notFound). Called before req is available. */
  notFound: () => never
  params: Promise<{ segments: string[] }>
  /** Framework redirect implementation (e.g. next/navigation redirect). Called before req is available. */
  redirect: (url: string) => never
  /**
   * Wrap the rendered admin view with the config's `admin.components.providers`
   * (via {@link NestProviders}). Next.js renders these in its server layout
   * (`@payloadcms/ui` `RootLayout`), so it leaves this `false`. Adapters whose
   * root layout runs on the client (e.g. TanStack Start) can't resolve provider
   * components from the import map there, so they opt in here to nest them
   * around the server-rendered view instead.
   */
  renderCustomProviders?: boolean
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const renderRoot = async ({
  adminViews,
  config: configPromise,
  importMap,
  initReq,
  notFound,
  params: paramsPromise,
  redirect,
  renderCustomProviders = false,
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

  const params = await paramsPromise

  const currentRoute = formatAdminURL({
    adminRoute,
    path: Array.isArray(params.segments) ? `/${params.segments.join('/')}` : null,
  })

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

      // Only redirect if there's NO custom view configured for /globals
      if (!viewKey) {
        redirect(adminRoute)
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
  } = await initReq({
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
      urlSuffix: `${currentRoute}${searchParams ? queryString : ''}`,
    },
  })

  if (
    !permissions.canAccessAdmin &&
    !isPublicAdminRoute({ adminRoute, config: payload.config, route: currentRoute }) &&
    !isCustomAdminView({ adminRoute, config: payload.config, route: currentRoute })
  ) {
    req.server.redirect(
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

  /**
   * This function is responsible for handling the case where the view is not found.
   * The current route did not match any default views or custom route views.
   */
  if (!DefaultView?.Component && !DefaultView?.payloadComponent) {
    if (req?.user) {
      req.server.notFound()
    }

    if (dbHasUser) {
      req.server.redirect(adminRoute)
    }
  }

  const usersCollection = config.collections.find(({ slug }) => slug === userSlug)
  const disableLocalStrategy = usersCollection?.auth?.disableLocalStrategy

  const createFirstUserRoute = formatAdminURL({
    adminRoute,
    path: _createFirstUserRoute,
  })

  if (disableLocalStrategy && currentRoute === createFirstUserRoute) {
    req.server.redirect(adminRoute)
  }

  if (!dbHasUser && currentRoute !== createFirstUserRoute && !disableLocalStrategy) {
    req.server.redirect(createFirstUserRoute)
  }

  if (dbHasUser && currentRoute === createFirstUserRoute) {
    req.server.redirect(adminRoute)
  }

  if (!DefaultView?.Component && !DefaultView?.payloadComponent && !dbHasUser) {
    req.server.redirect(adminRoute)
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
    req.server.redirect(
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
      viewActions,
    } satisfies AdminViewServerPropsOnly,
  })

  const customProviders = config.admin?.components?.providers

  const tree = (
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
            // The reason we are not passing in initPageResult.visibleEntities directly is due to a "Cannot assign to read only property of object '#<Object>" error introduced in React 19
            // which this caused as soon as initPageResult.visibleEntities is passed in
            collections: visibleEntities?.collections,
            globals: visibleEntities?.globals,
          }}
        >
          {RenderedView}
        </DefaultTemplate>
      )}
    </PageConfigProvider>
  )

  if (renderCustomProviders && Array.isArray(customProviders) && customProviders.length > 0) {
    return (
      <NestProviders
        importMap={importMap}
        providers={customProviders}
        serverProps={{
          i18n: req.i18n,
          payload: req.payload,
          permissions,
          server: req.server,
          user: req.user,
        }}
      >
        {tree}
      </NestProviders>
    )
  }

  return tree
}
