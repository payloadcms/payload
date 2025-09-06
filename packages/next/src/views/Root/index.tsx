import type { I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type {
  AdminViewClientProps,
  AdminViewServerPropsOnly,
  ImportMap,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { notFound, redirect } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'

import { DefaultTemplate } from '../../templates/Default/index.js'
import { MinimalTemplate } from '../../templates/Minimal/index.js'
import { getPreferences } from '../../utilities/getPreferences.js'
import { getVisibleEntities } from '../../utilities/getVisisbleEntities.js'
import { handleAuthRedirect } from '../../utilities/handleAuthRedirect.js'
import { initReq } from '../../utilities/initReq.js'
import { isCustomAdminView } from '../../utilities/isCustomAdminView.js'
import { isPublicAdminRoute } from '../../utilities/isPublicAdminRoute.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'
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
    return notFound()
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
      urlSuffix: `${currentRoute}${searchParams ? queryString : ''}`,
    },
  })

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

  let replaceListWithFolders = false

  if (collectionConfig && segments.length === 2) {
    if (config.folders && collectionConfig.folders && segments[1] !== config.folders.slug) {
      const prefs = await getPreferences<{
        listViewType: string
      }>(`collection-${collectionConfig.slug}`, req.payload, req.user.id, config.admin.user)
      if (prefs?.value.listViewType && prefs.value.listViewType === 'folders') {
        replaceListWithFolders = true
      }
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
    currentRoute,
    globalConfig,
    payload,
    replaceListWithFolders,
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
      notFound()
    }

    if (dbHasUser) {
      redirect(adminRoute)
    }
  }

  const createFirstUserRoute = formatAdminURL({ adminRoute, path: _createFirstUserRoute })

  const usersCollection = config.collections.find(({ slug }) => slug === userSlug)
  const disableLocalStrategy = usersCollection?.auth?.disableLocalStrategy

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
  })

  const visibleEntities = getVisibleEntities({ req })

  const folderID = routeParams.folderID

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
      params,
      payload: req.payload,
      searchParams,
      viewActions,
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
    </React.Fragment>
  )
}
