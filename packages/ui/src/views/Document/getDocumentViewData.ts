import type {
  CollectionPreferences,
  ComponentRenderer,
  Data,
  DefaultDocumentIDType,
  DocumentSlots,
  DocumentSubViewTypes,
  DocumentViewClientProps,
  EditViewComponent,
  FormState,
  Locale,
  PayloadComponent,
  PayloadRequest,
  RenderDocumentVersionsProperties,
  SanitizedCollectionConfig,
  SanitizedDocumentPermissions,
  SanitizedGlobalConfig,
  SanitizedPermissions,
  TypedUser,
  ViewTypes,
  VisibleEntities,
} from 'payload'

import { isolateObjectProperty } from 'payload'
import { formatAdminURL, hasAutosaveEnabled, hasDraftsEnabled } from 'payload/shared'

import { buildFormState } from '../../utilities/buildFormState.js'
import { getEntityPreferences } from '../../utilities/getEntityPreferences.js'
import { handleLivePreview } from '../../utilities/handleLivePreview.js'
import { handlePreview } from '../../utilities/handlePreview.js'
import { isEditing as getIsEditing } from '../../utilities/isEditing.js'
import { getDocPreferences } from './getDocPreferences.js'
import { getDocumentData } from './getDocumentData.js'
import { getDocumentPermissions } from './getDocumentPermissions.js'
import { getDocumentView } from './getDocumentView.js'
import { getIsLocked } from './getIsLocked.js'
import { getVersions } from './getVersions.js'
import { renderDocumentSlots } from './renderDocumentSlots.js'

export type DocumentViewData = {
  apiURL: string
  clientProps: DocumentViewClientProps
  collectionSlug?: string
  currentEditor?: TypedUser
  disableActions: boolean
  doc: Data
  docPermissions: SanitizedDocumentPermissions
  entityPreferences?: { id: DefaultDocumentIDType; value: CollectionPreferences }
  formState: FormState
  globalSlug?: string
  hasDeletePermission: boolean
  hasPublishedDoc: boolean
  hasPublishPermission: boolean
  hasSavePermission: boolean
  hasTrashPermission: boolean
  id: number | string
  isEditing: boolean
  isLivePreviewEnabled: boolean
  isLocked: boolean
  isPreviewEnabled: boolean
  isTrashedDoc: boolean
  lastUpdateTime?: number
  livePreviewBreakpoints?: {
    height: number | string
    label: string
    name: string
    width: number | string
  }[]
  livePreviewURL?: string
  mostRecentVersionIsAutosaved: boolean
  previewURL?: string
  /**
   * If set, the adapter should perform a redirect to this URL.
   * This is returned instead of calling redirect() directly to stay framework-agnostic.
   */
  redirect?: string
  showHeader: boolean
  slots: DocumentSlots
  typeofLivePreviewURL?: 'function' | 'string' | undefined
  unpublishedVersionCount: number
  versionCount: number
  View: EditViewComponent | PayloadComponent | React.FC
}

export type GetDocumentViewDataArgs = {
  collectionConfig?: SanitizedCollectionConfig
  cookies: Map<string, string>
  defaultViews: {
    edit: EditViewComponent | PayloadComponent | React.FC
    version: EditViewComponent | PayloadComponent | React.FC
    versions: EditViewComponent | PayloadComponent | React.FC
  }
  disableActions?: boolean
  docID?: number | string
  documentSubViewType?: DocumentSubViewTypes
  drawerSlug?: string
  globalConfig?: SanitizedGlobalConfig
  initialData?: Data
  locale: Locale
  overrideEntityVisibility?: boolean
  params?: { [key: string]: string | string[] | undefined }
  permissions: SanitizedPermissions
  redirectAfterCreate?: boolean
  renderComponent: ComponentRenderer
  req: PayloadRequest
  searchParams?: { [key: string]: string | string[] | undefined }
  versions?: RenderDocumentVersionsProperties
  viewType: ViewTypes
  visibleEntities?: VisibleEntities
}

export async function getDocumentViewData(
  args: GetDocumentViewDataArgs,
): Promise<DocumentViewData> {
  const {
    collectionConfig,
    defaultViews,
    disableActions,
    docID: idFromArgs,
    documentSubViewType = 'default',
    drawerSlug,
    globalConfig,
    initialData,
    locale,
    overrideEntityVisibility,
    params,
    permissions,
    redirectAfterCreate,
    renderComponent,
    req,
    req: {
      payload,
      payload: {
        config,
        config: {
          routes: { admin: adminRoute, api: apiRoute },
        },
      },
      user,
    },
    viewType,
    visibleEntities,
  } = args

  const segments = Array.isArray(params?.segments) ? params.segments : []
  const collectionSlug = collectionConfig?.slug || undefined
  const globalSlug = globalConfig?.slug || undefined
  let isEditing = getIsEditing({ id: idFromArgs, collectionSlug, globalSlug })

  let doc =
    !idFromArgs && !globalSlug
      ? initialData || null
      : await getDocumentData({
          id: idFromArgs,
          collectionSlug,
          globalSlug,
          locale,
          payload,
          req,
          segments,
          user,
        })

  if (isEditing && !doc) {
    if (collectionSlug) {
      const redirectURL = formatAdminURL({
        adminRoute,
        path: `/collections/${collectionSlug}?notFound=${encodeURIComponent(idFromArgs)}`,
      })

      return { redirect: redirectURL } as DocumentViewData
    } else {
      throw new Error('not-found')
    }
  }

  const isTrashedDoc = Boolean(doc && 'deletedAt' in doc && typeof doc?.deletedAt === 'string')

  const reqForPermissions = req.transactionID ? req : isolateObjectProperty(req, 'transactionID')
  const reqForLockCheck = req.transactionID ? req : isolateObjectProperty(req, 'transactionID')

  const [
    docPreferences,
    {
      docPermissions,
      hasDeletePermission,
      hasPublishPermission,
      hasSavePermission,
      hasTrashPermission,
    },
    { currentEditor, isLocked, lastUpdateTime },
    entityPreferences,
  ] = await Promise.all([
    getDocPreferences({
      id: idFromArgs,
      collectionSlug,
      globalSlug,
      payload,
      user,
    }),
    getDocumentPermissions({
      id: idFromArgs,
      collectionConfig,
      data: doc,
      globalConfig,
      req: reqForPermissions,
    }),
    getIsLocked({
      id: idFromArgs,
      collectionConfig,
      globalConfig,
      isEditing,
      req: reqForLockCheck,
    }),
    getEntityPreferences<CollectionPreferences>(
      collectionSlug ? `collection-${collectionSlug}` : `global-${globalSlug}`,
      payload,
      req.user.id,
      req.user.collection,
    ),
  ])

  const operation = (collectionSlug && idFromArgs) || globalSlug ? 'update' : 'create'

  const [
    { hasPublishedDoc, mostRecentVersionIsAutosaved, unpublishedVersionCount, versionCount },
    { state: formState },
  ] = await Promise.all([
    getVersions({
      id: idFromArgs,
      collectionConfig,
      doc,
      docPermissions,
      globalConfig,
      locale: locale?.code,
      payload,
      user,
    }),
    buildFormState(
      {
        id: idFromArgs,
        collectionSlug,
        data: doc,
        docPermissions,
        docPreferences,
        fallbackLocale: false,
        globalSlug,
        locale: locale?.code,
        operation,
        readOnly: isTrashedDoc || isLocked,
        renderAllFields: true,
        req,
        schemaPath: collectionSlug || globalSlug,
        skipValidation: true,
      },
      renderComponent,
    ),
  ])

  if (
    !overrideEntityVisibility &&
    ((collectionSlug &&
      !visibleEntities?.collections?.find((visibleSlug) => visibleSlug === collectionSlug)) ||
      (globalSlug && !visibleEntities?.globals?.find((visibleSlug) => visibleSlug === globalSlug)))
  ) {
    throw new Error('not-found')
  }

  const formattedParams = new URLSearchParams()

  if (hasDraftsEnabled(collectionConfig || globalConfig)) {
    formattedParams.append('draft', 'true')
  }

  if (locale?.code) {
    formattedParams.append('locale', locale.code)
  }

  const apiQueryParams = `?${formattedParams.toString()}`

  const apiURL = formatAdminURL({
    apiRoute,
    path: collectionSlug
      ? `/${collectionSlug}/${idFromArgs}${apiQueryParams}`
      : globalSlug
        ? `/${globalSlug}${apiQueryParams}`
        : '',
  })

  let View: EditViewComponent | PayloadComponent | React.FC = null
  let showHeader = true

  const RootViewOverride =
    collectionConfig?.admin?.components?.views?.edit?.root &&
    'Component' in collectionConfig.admin.components.views.edit.root
      ? collectionConfig?.admin?.components?.views?.edit?.root?.Component
      : globalConfig?.admin?.components?.views?.edit?.root &&
          'Component' in globalConfig.admin.components.views.edit.root
        ? globalConfig?.admin?.components?.views?.edit?.root?.Component
        : null

  if (RootViewOverride) {
    View = RootViewOverride
    showHeader = false
  } else {
    const result = getDocumentView({
      collectionConfig,
      config,
      defaultViews,
      docPermissions,
      globalConfig,
      routeSegments: segments,
    })

    View = result?.View as typeof View
  }

  const shouldAutosave = hasSavePermission && hasAutosaveEnabled(collectionConfig || globalConfig)

  const validateDraftData =
    collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.validate

  let id = idFromArgs

  if (shouldAutosave && !validateDraftData && !idFromArgs && collectionSlug) {
    doc = await payload.create({
      collection: collectionSlug,
      data: initialData || {},
      depth: 0,
      draft: true,
      fallbackLocale: false,
      locale: locale?.code,
      req,
      user,
    })

    if (doc?.id) {
      id = doc.id
      isEditing = getIsEditing({ id: doc.id, collectionSlug, globalSlug })

      if (!drawerSlug && redirectAfterCreate !== false) {
        const redirectURL = formatAdminURL({
          adminRoute,
          path: `/collections/${collectionSlug}/${doc.id}`,
        })

        return { redirect: redirectURL } as DocumentViewData
      }
    } else {
      throw new Error('not-found')
    }
  }

  const slots = renderDocumentSlots({
    id,
    collectionConfig,
    globalConfig,
    hasSavePermission,
    locale,
    permissions,
    renderComponent,
    req,
  })

  const clientProps: DocumentViewClientProps = {
    formState,
    ...slots,
    documentSubViewType,
    viewType,
  }

  const { isLivePreviewEnabled, livePreviewConfig, livePreviewURL } = await handleLivePreview({
    collectionSlug,
    config,
    data: doc,
    globalSlug,
    operation,
    req,
  })

  const { isPreviewEnabled, previewURL } = await handlePreview({
    collectionSlug,
    config,
    data: doc,
    globalSlug,
    operation,
    req,
  })

  return {
    id,
    apiURL,
    clientProps,
    collectionSlug,
    currentEditor,
    disableActions: disableActions ?? false,
    doc,
    docPermissions,
    entityPreferences,
    formState,
    globalSlug,
    hasDeletePermission,
    hasPublishedDoc,
    hasPublishPermission,
    hasSavePermission,
    hasTrashPermission,
    isEditing,
    isLivePreviewEnabled: isLivePreviewEnabled && operation !== 'create',
    isLocked,
    isPreviewEnabled: Boolean(isPreviewEnabled),
    isTrashedDoc,
    lastUpdateTime,
    livePreviewBreakpoints: livePreviewConfig?.breakpoints,
    livePreviewURL,
    mostRecentVersionIsAutosaved,
    previewURL,
    showHeader,
    slots,
    typeofLivePreviewURL: typeof livePreviewConfig?.url as 'function' | 'string' | undefined,
    unpublishedVersionCount,
    versionCount,
    View,
  }
}
