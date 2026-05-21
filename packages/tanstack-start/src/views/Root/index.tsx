import type { NavGroupType } from '@payloadcms/ui/shared'
import type { CreateFirstUserData } from '@payloadcms/ui/views/CreateFirstUser/getCreateFirstUserData'
import type { SerializableDocumentViewData } from '@payloadcms/ui/views/Document/buildDocumentViewClientProps'
import type { SerializableListViewData } from '@payloadcms/ui/views/List/buildListViewClientProps'
import type {
  AdminViewClientProps,
  ClientUser,
  CollectionPreferences,
  CustomComponent,
  DocumentSubViewTypes,
  ImportMap,
  InitPageResult,
  Locale,
  NavPreferences,
  PayloadComponent,
  SanitizedConfig,
  SanitizedPermissions,
  TypeWithVersion,
  ViewTypes,
  VisibleEntities,
} from 'payload'
import type React from 'react'

import { DefaultEditView } from '@payloadcms/ui'
import { getNavData } from '@payloadcms/ui/elements/Nav/getNavData'
import { getDocumentViewData } from '@payloadcms/ui/server'
import { getGlobalData, getNavGroups } from '@payloadcms/ui/shared'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { getClientSchemaMap } from '@payloadcms/ui/utilities/getClientSchemaMap'
import { getSchemaMap } from '@payloadcms/ui/utilities/getSchemaMap'
import { getAccountViewData } from '@payloadcms/ui/views/Account/getAccountViewData'
import { getCreateFirstUserData } from '@payloadcms/ui/views/CreateFirstUser/getCreateFirstUserData'
import { toSerializableFormState } from '@payloadcms/ui/views/Document/buildDocumentViewClientProps'
import { getListViewData } from '@payloadcms/ui/views/List/getListViewData'
import { toSerializableListViewData } from '@payloadcms/ui/views/List/toSerializableListViewData'
import { getLoginViewData } from '@payloadcms/ui/views/Login/getLoginViewData'
import { getRootViewData } from '@payloadcms/ui/views/Root/getRootViewData'
import { getVersionViewData } from '@payloadcms/ui/views/Version/getVersionViewData'
import { getVersionsViewData } from '@payloadcms/ui/views/Versions/getVersionsViewData'
import { formatAdminURL, isNumber } from 'payload/shared'
import * as qs from 'qs-esm'

import { RenderRSCComponent } from '../../rsc/renderPayloadRSC.js'
import { getPreferences } from '../../utilities/getPreferences.js'
import { initReq } from '../../utilities/initReq.server.js'
import { getRouteData } from './getRouteData.js'

export type SerializableRouteData = {
  collectionSlug?: string
  /**
   * When the config defines a custom component for a built-in view type (e.g. createFirstUser),
   * this holds the PayloadComponent descriptor so the client can look it up in the importMap.
   */
  customViewComponent?: PayloadComponent
  documentSubViewType?: DocumentSubViewTypes
  globalSlug?: string
  hasView: boolean
  routeParams: {
    collection?: string
    global?: string
    id?: number | string
    token?: string
    versionID?: number | string
  }
  templateClassName: string
  templateType: 'default' | 'minimal' | undefined
  viewActions?: CustomComponent[]
  viewType?: ViewTypes
}

export type SerializableDashboardData = {
  adminRoute: string
  afterDashboard?: CustomComponent[]
  beforeDashboard?: CustomComponent[]
  globalData: Array<{
    data: { _isLocked: boolean; _lastEditedAt: string; _userEditing: ClientUser | number | string }
    lockDuration?: number
    slug: string
  }>
  navGroups: NavGroupType[]
  permissions: SanitizedPermissions
  userId?: number | string
}

export type SerializableLoginData = {
  afterLogin?: CustomComponent[]
  beforeLogin?: CustomComponent[]
  isLocalStrategyDisabled: boolean
  prefillEmail?: string
  prefillPassword?: string
  prefillUsername?: string
}

export type SerializableCreateFirstUserData = {
  beginMessage: string
  docPermissions: CreateFirstUserData['docPermissions']
  docPreferences: CreateFirstUserData['docPreferences']
  formState: CreateFirstUserData['formState']
  loginWithUsername?: CreateFirstUserData['loginWithUsername']
  userSlug: string
  welcomeMessage: string
}

import type { VersionsViewData } from '@payloadcms/ui/views/Versions/getVersionsViewData'

export type SerializableVersionsData = {
  currentlyPublishedVersion: VersionsViewData['currentlyPublishedVersion']
  fetchURL: string
  latestDraftVersion: VersionsViewData['latestDraftVersion']
  paginationLimits?: number[]
  versionsData: VersionsViewData['versionsData']
}

export type SerializableVersionViewData = {
  blocks: Record<string, unknown>
  canUpdate: boolean
  clientSchemaMap: Record<string, unknown>
  currentlyPublishedVersion: null | TypeWithVersion<object>
  fields: unknown[]
  fieldsPermissions: unknown
  hasPublishedDoc: boolean
  latestDraftVersion: null | TypeWithVersion<object>
  modifiedOnly: boolean
  previousPublishedVersion: null | TypeWithVersion<object>
  previousVersion: null | TypeWithVersion<object>
  selectedLocales: string[]
  versionFrom: null | TypeWithVersion<object>
  versionTo: TypeWithVersion<{ _status?: string }>
}

export type AdminPageData = {
  adminProviders?: unknown[]
  createFirstUserData?: SerializableCreateFirstUserData
  customViewRenderContext?: CustomViewRenderContext
  dashboardData?: SerializableDashboardData
  documentData?: SerializableDocumentViewData
  listData?: SerializableListViewData
  locale: Locale
  loginData?: SerializableLoginData
  navGroups: NavGroupType[]
  navPreferences: NavPreferences
  permissions: SanitizedPermissions
  routeData: SerializableRouteData
  versionsData?: SerializableVersionsData
  versionViewData?: SerializableVersionViewData
  viewProps: AdminViewClientProps
  visibleEntities: VisibleEntities
}

/**
 * Provided when viewType is 'custom' so the caller (server function) can use
 * `renderServerComponent` to render the custom view as a proper RSC with
 * `initPageResult` props.
 */
export type CustomViewRenderContext = {
  customViewComponent: PayloadComponent
  initPageResult: InitPageResult
}

export type GetAdminPageDataArgs = {
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  params: { segments: string[] }
  searchParams: { [key: string]: string | string[] }
}

export async function getAdminPageData({
  configPromise,
  importMap,
  params,
  searchParams,
}: GetAdminPageDataArgs): Promise<{ data: AdminPageData } | { redirect: string }> {
  const renderComponent = RenderRSCComponent

  const config = await configPromise
  const segments = Array.isArray(params.segments) ? params.segments : []

  const {
    routes: { admin: adminRoute },
  } = config

  const currentRoute = formatAdminURL({
    adminRoute,
    path: segments.length ? `/${segments.join('/')}` : null,
  })
  const queryString = qs.stringify(searchParams ?? {}, { addQueryPrefix: true })

  const initResult = await initReq({
    configPromise: config,
    importMap,
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
      throw new Error('not-found')
    }
    throw error
  }

  if (rootData.redirect) {
    return { redirect: rootData.redirect }
  }

  const { collectionConfig, globalConfig, req } = rootData

  let collectionPreferences: CollectionPreferences | undefined

  if (collectionConfig && segments.length === 2 && collectionConfig.hierarchy && req.user) {
    const prefs = await getPreferences<CollectionPreferences>(
      `collection-${collectionConfig.slug}`,
      req.payload,
      req.user.id,
      config.admin.user,
    )
    if (prefs?.value) {
      collectionPreferences = prefs.value
    }
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

  const { groups: navGroups, navPreferences } = await getNavData({
    i18n: req.i18n,
    payload: req.payload,
    permissions: rootData.permissions,
    req,
    visibleEntities: rootData.visibleEntities,
  })

  const viewProps: AdminViewClientProps = {
    clientConfig: rootData.clientConfig,
    documentSubViewType: routeData.documentSubViewType,
    viewType: routeData.viewType ?? ('dashboard' as ViewTypes),
  }

  const serializableRouteData: SerializableRouteData = {
    collectionSlug: routeData.collectionConfig?.slug,
    customViewComponent: routeData.customViewComponent,
    documentSubViewType: routeData.documentSubViewType,
    globalSlug: routeData.globalConfig?.slug,
    hasView: routeData.hasView,
    routeParams: routeData.routeParams,
    templateClassName: routeData.templateClassName,
    templateType: routeData.templateType,
    viewActions: routeData.viewActions,
    viewType: routeData.viewType,
  }

  const adminPageData: AdminPageData = {
    adminProviders: config.admin?.components?.providers ?? [],
    locale: rootData.locale,
    navGroups,
    navPreferences,
    permissions: rootData.permissions,
    routeData: serializableRouteData,
    viewProps,
    visibleEntities: rootData.visibleEntities,
  }

  const viewType = routeData.viewType

  if (viewType === 'custom' && routeData.customViewComponent) {
    const languageOptions = Object.entries(config.i18n.supportedLanguages || {}).reduce(
      (acc, [language, languageConfig]) => {
        if (Object.keys(config.i18n.supportedLanguages).includes(language)) {
          acc.push({
            label: (languageConfig as any).translations?.general?.thisLanguage || language,
            value: language,
          })
        }
        return acc
      },
      [] as Array<{ label: string; value: string }>,
    )

    const initPageResult: InitPageResult = {
      collectionConfig: rootData.collectionConfig,
      cookies: rootData.cookies,
      globalConfig: rootData.globalConfig,
      languageOptions: languageOptions as any,
      locale: rootData.locale,
      permissions: rootData.permissions,
      req,
      translations: req.i18n.translations as any,
      visibleEntities: rootData.visibleEntities,
    }

    adminPageData.customViewRenderContext = {
      customViewComponent: routeData.customViewComponent,
      initPageResult,
    }
  }

  if ((viewType === 'list' || viewType === 'trash') && collectionConfig) {
    try {
      const listViewResult = await getListViewData({
        clientConfig: rootData.clientConfig,
        collectionConfig,
        enableRowSelections: viewType === 'list',
        locale: rootData.locale,
        params,
        permissions: rootData.permissions,
        renderComponent,
        req,
        searchParams,
        trash: viewType === 'trash',
        viewType: viewType as ViewTypes,
        visibleEntities: rootData.visibleEntities,
      })

      adminPageData.listData = toSerializableListViewData({
        collectionConfig,
        fieldPermissions: rootData.permissions?.collections?.[collectionConfig.slug]?.fields,
        listViewData: listViewResult,
        t: req.i18n.t,
      })
    } catch (err) {
      if ((err as Error).message === 'not-found') {
        throw new Error('not-found')
      }
      throw err
    }
  }

  if ((viewType === 'document' || viewType === 'version') && (collectionConfig || globalConfig)) {
    try {
      const docViewResult = await getDocumentViewData({
        collectionConfig,
        cookies: rootData.cookies,
        defaultViews: {
          edit: DefaultEditView as any,
          version: DefaultEditView as any,
          versions: DefaultEditView as any,
        },
        disableActions: false,
        docID: routeData.routeParams.id,
        documentSubViewType: routeData.documentSubViewType || 'default',
        globalConfig,
        locale: rootData.locale,
        params,
        permissions: rootData.permissions,
        renderComponent,
        req,
        searchParams,
        viewType: viewType as ViewTypes,
        visibleEntities: rootData.visibleEntities,
      })

      if (docViewResult.redirect) {
        return { redirect: docViewResult.redirect }
      }

      const entityConfig = collectionConfig || globalConfig
      const livePreviewComponentSpec =
        entityConfig?.admin?.components?.views?.edit?.livePreview?.Component
      const livePreviewComponent =
        typeof livePreviewComponentSpec === 'string'
          ? livePreviewComponentSpec
          : typeof livePreviewComponentSpec === 'object' && livePreviewComponentSpec?.path
            ? `${livePreviewComponentSpec.path}#${livePreviewComponentSpec.exportName ?? 'default'}`
            : undefined

      adminPageData.documentData = {
        id: docViewResult.id,
        apiURL: docViewResult.apiURL,
        collectionSlug: docViewResult.collectionSlug,
        currentEditor: docViewResult.currentEditor,
        disableActions: docViewResult.disableActions,
        doc: docViewResult.doc,
        docPermissions: docViewResult.docPermissions,
        documentSubViewType: routeData.documentSubViewType,
        entityPreferences: docViewResult.entityPreferences,
        formState: toSerializableFormState(docViewResult.formState),
        globalSlug: docViewResult.globalSlug,
        hasDeletePermission: docViewResult.hasDeletePermission,
        hasPublishedDoc: docViewResult.hasPublishedDoc,
        hasPublishPermission: docViewResult.hasPublishPermission,
        hasSavePermission: docViewResult.hasSavePermission,
        hasTrashPermission: docViewResult.hasTrashPermission,
        isEditing: docViewResult.isEditing,
        isLivePreviewEnabled: docViewResult.isLivePreviewEnabled,
        isLocked: docViewResult.isLocked,
        isPreviewEnabled: docViewResult.isPreviewEnabled,
        isTrashedDoc: docViewResult.isTrashedDoc,
        lastUpdateTime: docViewResult.lastUpdateTime,
        livePreviewBreakpoints: docViewResult.livePreviewBreakpoints,
        livePreviewComponent,
        livePreviewURL: docViewResult.livePreviewURL,
        locale: rootData.locale,
        mostRecentVersionIsAutosaved: docViewResult.mostRecentVersionIsAutosaved,
        previewURL: docViewResult.previewURL,
        showHeader: docViewResult.showHeader,
        typeofLivePreviewURL: docViewResult.typeofLivePreviewURL,
        unpublishedVersionCount: docViewResult.unpublishedVersionCount,
        versionCount: docViewResult.versionCount,
        viewType: viewType as ViewTypes,
      }
    } catch (err) {
      if ((err as Error).message === 'not-found') {
        throw new Error('not-found')
      }
      throw err
    }
  }

  if (
    routeData.documentSubViewType === 'versions' &&
    (collectionConfig || globalConfig) &&
    adminPageData.documentData
  ) {
    try {
      const defaultLimit = collectionConfig?.slug
        ? collectionConfig?.admin?.pagination?.defaultLimit
        : 10
      const limitToUse = isNumber(searchParams?.limit) ? Number(searchParams.limit) : defaultLimit

      const versionsResult = await getVersionsViewData({
        id: routeData.routeParams.id,
        collectionConfig,
        globalConfig,
        hasPublishedDoc: adminPageData.documentData.hasPublishedDoc,
        limit: limitToUse,
        page: searchParams?.page ? parseInt(String(searchParams.page), 10) : undefined,
        req,
        sort: searchParams?.sort as string,
      })

      adminPageData.versionsData = {
        currentlyPublishedVersion: versionsResult.currentlyPublishedVersion,
        fetchURL: versionsResult.fetchURL,
        latestDraftVersion: versionsResult.latestDraftVersion,
        paginationLimits: collectionConfig?.admin?.pagination?.limits,
        versionsData: versionsResult.versionsData,
      }
    } catch (err) {
      if ((err as Error).message === 'not-found') {
        throw new Error('not-found')
      }
      throw err
    }
  }

  if (
    routeData.documentSubViewType === 'version' &&
    routeData.routeParams.versionID &&
    (collectionConfig || globalConfig) &&
    adminPageData.documentData
  ) {
    try {
      const versionToID = String(routeData.routeParams.versionID)
      const versionFromIDFromParams = searchParams?.versionFrom as string | undefined
      const localeCodesFromParams = searchParams?.localeCodes
        ? JSON.parse(searchParams.localeCodes as string)
        : null
      const modifiedOnly: boolean = searchParams?.modifiedOnly === 'false' ? false : true

      const versionData = await getVersionViewData({
        id: routeData.routeParams.id,
        collectionConfig,
        globalConfig,
        hasPublishedDoc: adminPageData.documentData.hasPublishedDoc,
        localeCodesFromParams,
        permissions: rootData.permissions,
        req,
        versionFromIDFromParams,
        versionToID,
      })

      const entityConfig = collectionConfig || globalConfig
      const docPermissions = collectionConfig
        ? rootData.permissions.collections?.[collectionConfig.slug]
        : rootData.permissions.globals?.[globalConfig!.slug]

      const collectionSlug = collectionConfig?.slug
      const globalSlug = globalConfig?.slug

      const schemaMap = getSchemaMap({
        collectionSlug,
        config: req.payload.config,
        globalSlug,
        i18n: req.i18n,
      })

      const clientSchemaMap = getClientSchemaMap({
        collectionSlug,
        config: getClientConfig({
          config: req.payload.config,
          i18n: req.i18n,
          importMap: req.payload.importMap,
          user: req.user ?? true,
        }),
        globalSlug,
        i18n: req.i18n,
        payload: req.payload,
        schemaMap,
      })

      adminPageData.versionViewData = {
        blocks: req.payload.blocks as unknown as Record<string, unknown>,
        canUpdate: Boolean(docPermissions?.update),
        clientSchemaMap: Object.fromEntries(clientSchemaMap as Map<string, unknown>),
        currentlyPublishedVersion: versionData.currentlyPublishedVersion,
        fields: entityConfig?.fields as unknown as unknown[],
        fieldsPermissions: docPermissions?.fields,
        hasPublishedDoc: adminPageData.documentData.hasPublishedDoc,
        latestDraftVersion: versionData.latestDraftVersion,
        modifiedOnly,
        previousPublishedVersion: versionData.previousPublishedVersion,
        previousVersion: versionData.previousVersion,
        selectedLocales: versionData.selectedLocales,
        versionFrom: versionData.versionFrom,
        versionTo: versionData.versionTo,
      }
    } catch (err) {
      if ((err as Error).message === 'not-found') {
        throw new Error('not-found')
      }
      throw err
    }
  }

  if (viewType === 'dashboard') {
    const globalData = await getGlobalData(req)
    const dashboardNavGroups = getNavGroups(
      rootData.permissions,
      rootData.visibleEntities,
      config,
      req.i18n,
    )

    adminPageData.dashboardData = {
      adminRoute,
      afterDashboard: config.admin?.components?.afterDashboard,
      beforeDashboard: config.admin?.components?.beforeDashboard,
      globalData,
      navGroups: dashboardNavGroups,
      permissions: rootData.permissions,
      userId: req.user?.id,
    }
  }

  if (viewType === 'account') {
    try {
      const accountData = await getAccountViewData({
        locale: rootData.locale,
        renderComponent,
        req,
      })

      adminPageData.documentData = {
        id: req.user!.id,
        apiURL: accountData.apiURL,
        collectionSlug: accountData.collectionConfig.slug,
        currentEditor: accountData.currentEditor,
        disableActions: false,
        doc: accountData.data,
        docPermissions: accountData.docPermissions,
        documentSubViewType: 'default',
        formState: toSerializableFormState(accountData.formState),
        hasDeletePermission: accountData.hasDeletePermission,
        hasPublishedDoc: accountData.hasPublishedDoc,
        hasPublishPermission: accountData.hasPublishPermission,
        hasSavePermission: accountData.hasSavePermission,
        hasTrashPermission: accountData.hasTrashPermission,
        isEditing: true,
        isLivePreviewEnabled: false,
        isLocked: accountData.isLocked,
        isPreviewEnabled: false,
        isTrashedDoc: false,
        lastUpdateTime: accountData.lastUpdateTime,
        livePreviewBreakpoints: [],
        locale: rootData.locale,
        mostRecentVersionIsAutosaved: accountData.mostRecentVersionIsAutosaved,
        showHeader: true,
        unpublishedVersionCount: accountData.unpublishedVersionCount,
        versionCount: accountData.versionCount,
        viewType: 'account' as ViewTypes,
      }

      serializableRouteData.collectionSlug = accountData.collectionConfig.slug
    } catch (err) {
      if ((err as Error).message === 'not-found') {
        throw new Error('not-found')
      }
      throw err
    }
  }

  if (viewType === 'createFirstUser') {
    const cfuData = await getCreateFirstUserData({
      locale: rootData.locale,
      renderComponent,
      req,
    })

    adminPageData.createFirstUserData = {
      beginMessage: cfuData.beginMessage,
      docPermissions: cfuData.docPermissions,
      docPreferences: cfuData.docPreferences,
      formState: toSerializableFormState(cfuData.formState),
      loginWithUsername: cfuData.loginWithUsername,
      userSlug: cfuData.userSlug,
      welcomeMessage: cfuData.welcomeMessage,
    }
  }

  if (serializableRouteData.templateClassName === 'login') {
    const loginData = getLoginViewData({
      config,
      searchParams,
      user: req.user,
    })

    if (loginData.isLoggedIn) {
      return { redirect: loginData.redirectUrl }
    }

    adminPageData.loginData = {
      afterLogin: loginData.afterLogin,
      beforeLogin: loginData.beforeLogin,
      isLocalStrategyDisabled: loginData.isLocalStrategyDisabled,
      prefillEmail: loginData.prefillEmail,
      prefillPassword: loginData.prefillPassword,
      prefillUsername: loginData.prefillUsername,
    }
  }

  return { data: adminPageData }
}
