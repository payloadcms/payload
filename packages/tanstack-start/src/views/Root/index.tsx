import type { NavGroupType } from '@payloadcms/ui/shared'
import type { CreateFirstUserData } from '@payloadcms/ui/views/CreateFirstUser/getCreateFirstUserData'
import type { SerializableDocumentViewData } from '@payloadcms/ui/views/Document/buildDocumentViewClientProps'
import type { SerializableListViewData } from '@payloadcms/ui/views/List/buildListViewClientProps'
import type {
  AdminViewClientProps,
  ClientUser,
  CollectionPreferences,
  CollectionSlug,
  CustomComponent,
  DocumentSubViewTypes,
  ImportMap,
  Locale,
  NavPreferences,
  SanitizedConfig,
  SanitizedPermissions,
  ViewTypes,
  VisibleEntities,
} from 'payload'

import { DefaultEditView } from '@payloadcms/ui'
import { getNavData } from '@payloadcms/ui/elements/Nav/getNavData'
import { RenderClientComponent } from '@payloadcms/ui/elements/RenderServerComponent/clientOnly'
import { getGlobalData, getNavGroups } from '@payloadcms/ui/shared'
import { getCreateFirstUserData } from '@payloadcms/ui/views/CreateFirstUser/getCreateFirstUserData'
import { toSerializableFormState } from '@payloadcms/ui/views/Document/buildDocumentViewClientProps'
import { getDocumentViewData } from '@payloadcms/ui/views/Document/getDocumentViewData'
import { getListViewData } from '@payloadcms/ui/views/List/getListViewData'
import { getLoginViewData } from '@payloadcms/ui/views/Login/getLoginViewData'
import { getRootViewData } from '@payloadcms/ui/views/Root/getRootViewData'
import { getVersionsViewData } from '@payloadcms/ui/views/Versions/getVersionsViewData'
import { formatAdminURL, isNumber } from 'payload/shared'
import * as qs from 'qs-esm'

import { getPreferences } from '../../utilities/getPreferences.js'
import { initReq } from '../../utilities/initReq.js'
import { getRouteData } from './getRouteData.js'

export type SerializableRouteData = {
  browseByFolderSlugs: CollectionSlug[]
  collectionSlug?: string
  documentSubViewType?: DocumentSubViewTypes
  globalSlug?: string
  hasView: boolean
  routeParams: {
    collection?: string
    folderCollection?: string
    folderID?: number | string
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

export type AdminPageData = {
  createFirstUserData?: SerializableCreateFirstUserData
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
  viewProps: AdminViewClientProps
  visibleEntities: VisibleEntities
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

  if (collectionConfig && segments.length === 2) {
    if (
      config.folders &&
      collectionConfig.folders &&
      segments[1] !== config.folders.slug &&
      req.user
    ) {
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
    permissions: rootData.permissions,
    req,
    visibleEntities: rootData.visibleEntities,
  })

  const viewProps: AdminViewClientProps = {
    browseByFolderSlugs: routeData.browseByFolderSlugs,
    clientConfig: rootData.clientConfig,
    documentSubViewType: routeData.documentSubViewType,
    viewType: routeData.viewType ?? ('dashboard' as ViewTypes),
  }

  const serializableRouteData: SerializableRouteData = {
    browseByFolderSlugs: routeData.browseByFolderSlugs,
    collectionSlug: routeData.collectionConfig?.slug,
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
    locale: rootData.locale,
    navGroups,
    navPreferences,
    permissions: rootData.permissions,
    routeData: serializableRouteData,
    viewProps,
    visibleEntities: rootData.visibleEntities,
  }

  const viewType = routeData.viewType

  if (viewType === 'list' && collectionConfig) {
    try {
      const listViewResult = await getListViewData({
        clientConfig: rootData.clientConfig,
        collectionConfig,
        enableRowSelections: true,
        locale: rootData.locale,
        params,
        permissions: rootData.permissions,
        renderComponent: RenderClientComponent,
        req,
        searchParams,
        viewType: viewType as ViewTypes,
        visibleEntities: rootData.visibleEntities,
      })

      const rawDescription =
        typeof collectionConfig.admin.description === 'function'
          ? collectionConfig.admin.description({ t: req.i18n.t })
          : collectionConfig.admin.description
      const staticDescription = typeof rawDescription === 'string' ? rawDescription : undefined

      adminPageData.listData = {
        collectionPreferences: listViewResult.collectionPreferences,
        collectionSlug: listViewResult.collectionSlug,
        columns: listViewResult.columnState.map((col) => ({
          accessor: col.accessor,
          active: col.active,
        })),
        data: listViewResult.data,
        description: staticDescription,
        disableBulkDelete: listViewResult.disableBulkDelete,
        disableBulkEdit: listViewResult.disableBulkEdit,
        disableQueryPresets: listViewResult.disableQueryPresets,
        enableRowSelections: listViewResult.enableRowSelections,
        fieldPermissions: rootData.permissions?.collections?.[collectionConfig.slug]?.fields,
        hasCreatePermission: listViewResult.hasCreatePermission,
        hasDeletePermission: listViewResult.hasDeletePermission,
        hasTrashPermission: listViewResult.hasTrashPermission,
        isInDrawer: listViewResult.isInDrawer,
        newDocumentURL: listViewResult.newDocumentURL,
        orderableFieldName: collectionConfig.orderable === true ? '_order' : undefined,
        query: listViewResult.query,
        queryPreset: listViewResult.queryPreset,
        queryPresetPermissions: listViewResult.queryPresetPermissions,
        resolvedFilterOptions: listViewResult.resolvedFilterOptions,
        useAsTitle: collectionConfig.admin.useAsTitle,
        viewType: listViewResult.viewType,
      }
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
        renderComponent: RenderClientComponent,
        req,
        searchParams,
        viewType: viewType as ViewTypes,
        visibleEntities: rootData.visibleEntities,
      })

      if (docViewResult.redirect) {
        return { redirect: docViewResult.redirect }
      }

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
      globalData,
      navGroups: dashboardNavGroups,
      permissions: rootData.permissions,
      userId: req.user?.id,
    }
  }

  if (viewType === 'createFirstUser') {
    const cfuData = await getCreateFirstUserData({
      locale: rootData.locale,
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
      isLocalStrategyDisabled: loginData.isLocalStrategyDisabled,
      prefillEmail: loginData.prefillEmail,
      prefillPassword: loginData.prefillPassword,
      prefillUsername: loginData.prefillUsername,
    }
  }

  return { data: adminPageData }
}
