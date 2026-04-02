import type {
  Data,
  DefaultServerFunctionArgs,
  DocumentSubViewTypes,
  DocumentViewClientProps,
  RenderDocumentVersionsProperties,
  ServerFunction,
  VisibleEntities,
} from 'payload'

import { reduceToSerializableFields } from '@payloadcms/ui/shared'
import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import { handleLivePreview } from '@payloadcms/ui/utilities/handleLivePreview'
import { handlePreview } from '@payloadcms/ui/utilities/handlePreview'
import { isEditing as getIsEditing } from '@payloadcms/ui/utilities/isEditing'
import { getDocPreferences } from '@payloadcms/ui/views/Document/getDocPreferences'
import { getDocumentData } from '@payloadcms/ui/views/Document/getDocumentData'
import { getDocumentPermissions } from '@payloadcms/ui/views/Document/getDocumentPermissions'
import { getIsLocked } from '@payloadcms/ui/views/Document/getIsLocked'
import { getVersions } from '@payloadcms/ui/views/Document/getVersions'
import { canAccessAdmin, isEntityHidden } from 'payload'
import { formatAdminURL, hasAutosaveEnabled, hasDraftsEnabled } from 'payload/shared'

export const TANSTACK_INVALIDATE = {
  __tanstack_invalidate: true as const,
}

export type TanStackInvalidateResult = typeof TANSTACK_INVALIDATE

type TanStackDocumentStateArgs = {
  account?: boolean
  collectionSlug?: string
  docID?: number | string
  documentSubViewType?: DocumentSubViewTypes
  globalSlug?: string
  redirectAfterCreate?: boolean
  redirectAfterDelete?: boolean
  redirectAfterDuplicate?: boolean
  redirectAfterRestore?: boolean
  searchParams?: Record<string, string | string[]>
  segments: string[]
  versions?: RenderDocumentVersionsProperties
} & DefaultServerFunctionArgs

export type TanStackDocumentStateResult = {
  apiURL?: string
  collectionSlug?: string
  currentEditor?: unknown
  docPermissions?: Record<string, unknown>
  globalSlug?: string
  hasDeletePermission?: boolean
  hasPublishedDoc: boolean
  hasPublishPermission?: boolean
  hasSavePermission?: boolean
  hasTrashPermission?: boolean
  hideTabs?: boolean
  id?: number | string
  initialData?: Data
  initialState?: DocumentViewClientProps['formState']
  isEditing?: boolean
  isLivePreviewEnabled?: boolean
  isLocked: boolean
  isPreviewEnabled?: boolean
  isTrashed?: boolean
  lastUpdateTime: number
  livePreviewBreakpoints?: unknown[]
  livePreviewURL?: string
  mostRecentVersionIsAutosaved: boolean
  previewURL?: string
  redirectURL?: string
  typeofLivePreviewURL?: 'function' | 'string'
  unpublishedVersionCount: number
  versionCount: number
}

const getVisibleEntities = ({
  payload,
  user,
}: {
  payload: DefaultServerFunctionArgs['req']['payload']
  user: DefaultServerFunctionArgs['req']['user']
}): VisibleEntities => ({
  collections: payload.config.collections
    .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
    .filter(Boolean),
  globals: payload.config.globals
    .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
    .filter(Boolean),
})

export const tanstackDocumentStateHandler: ServerFunction<
  TanStackDocumentStateArgs,
  Promise<TanStackDocumentStateResult>
> = async (args) => {
  const {
    account,
    collectionSlug: collectionSlugFromArgs,
    docID: docIDFromArgs,
    documentSubViewType = 'default',
    globalSlug: globalSlugFromArgs,
    redirectAfterCreate,
    req,
    req: {
      payload,
      payload: {
        config,
        config: {
          admin: { user: userSlug },
          routes: { admin: adminRoute, api: apiRoute },
        },
      },
      user,
    },
    searchParams: _searchParams = {},
    segments,
    versions: _versions,
  } = args

  await canAccessAdmin({ req })

  const collectionSlug =
    account || (!collectionSlugFromArgs && !globalSlugFromArgs && documentSubViewType === 'default')
      ? userSlug
      : collectionSlugFromArgs

  const globalSlug = account ? undefined : globalSlugFromArgs
  const docID = account ? user?.id : docIDFromArgs

  const collectionConfig = collectionSlug ? payload.collections[collectionSlug]?.config : undefined
  const globalConfig = globalSlug
    ? payload.config.globals.find((global) => global.slug === globalSlug)
    : undefined

  if (!collectionConfig && !globalConfig) {
    throw new Error('not-found')
  }

  const visibleEntities = getVisibleEntities({ payload, user })

  if (
    (collectionSlug && !visibleEntities.collections.includes(collectionSlug)) ||
    (globalSlug && !visibleEntities.globals.includes(globalSlug))
  ) {
    throw new Error('not-found')
  }

  const id = docID
  const isEditing = getIsEditing({ id, collectionSlug, globalSlug })

  const data = await getDocumentData({
    id,
    collectionSlug,
    globalSlug,
    locale: req.locale,
    payload,
    req,
    segments,
    user,
  })

  if (isEditing && !data) {
    if (collectionSlug) {
      return {
        hasPublishedDoc: false,
        isLocked: false,
        lastUpdateTime: Date.now(),
        mostRecentVersionIsAutosaved: false,
        redirectURL: formatAdminURL({
          adminRoute,
          path: `/collections/${collectionSlug}?notFound=${encodeURIComponent(String(id))}`,
        }),
        unpublishedVersionCount: 0,
        versionCount: 0,
      }
    }

    throw new Error('not-found')
  }

  const docPreferences = await getDocPreferences({
    id,
    collectionSlug,
    globalSlug,
    payload,
    user,
  })

  const {
    docPermissions,
    hasDeletePermission,
    hasPublishPermission,
    hasSavePermission,
    hasTrashPermission,
  } = await getDocumentPermissions({
    id,
    collectionConfig,
    data,
    globalConfig,
    req,
  })

  let resolvedData = data
  let resolvedID = id

  const shouldAutosave =
    hasSavePermission && hasAutosaveEnabled(collectionConfig || globalConfig) && collectionSlug
  const validateDraftData =
    typeof collectionConfig?.versions?.drafts === 'object' &&
    collectionConfig.versions.drafts?.validate

  if (shouldAutosave && !validateDraftData && !id && collectionSlug) {
    const createdDoc = await payload.create({
      collection: collectionSlug,
      data: resolvedData || {},
      depth: 0,
      draft: true,
      fallbackLocale: false,
      locale: req.locale,
      req,
      user,
    })

    if (createdDoc?.id) {
      resolvedData = createdDoc
      resolvedID = createdDoc.id

      if (redirectAfterCreate !== false) {
        return {
          hasPublishedDoc: false,
          isLocked: false,
          lastUpdateTime: Date.now(),
          mostRecentVersionIsAutosaved: false,
          redirectURL: formatAdminURL({
            adminRoute,
            path: `/collections/${collectionSlug}/${createdDoc.id}`,
          }),
          unpublishedVersionCount: 0,
          versionCount: 0,
        }
      }
    }
  }

  const operation = (collectionSlug && resolvedID) || globalSlug ? 'update' : 'create'

  const { state } = await buildFormState({
    id: resolvedID,
    collectionSlug,
    data: resolvedData,
    docPermissions,
    docPreferences,
    fallbackLocale: false,
    globalSlug,
    locale: req.locale,
    operation,
    readOnly: false,
    renderAllFields: true,
    req,
    schemaPath: collectionSlug || globalSlug,
    skipValidation: true,
  })

  const { currentEditor, isLocked, lastUpdateTime } = await getIsLocked({
    id: resolvedID,
    collectionConfig,
    globalConfig,
    isEditing: Boolean((collectionSlug && resolvedID) || globalSlug),
    req,
  })

  const { hasPublishedDoc, mostRecentVersionIsAutosaved, unpublishedVersionCount, versionCount } =
    await getVersions({
      id: resolvedID,
      collectionConfig,
      doc: resolvedData,
      docPermissions,
      globalConfig,
      locale: req.locale,
      payload,
      user,
    })

  const formattedParams = new URLSearchParams()

  if (hasDraftsEnabled(collectionConfig || globalConfig)) {
    formattedParams.append('draft', 'true')
  }

  if (req.locale) {
    formattedParams.append('locale', req.locale)
  }

  const apiQueryParams = `?${formattedParams.toString()}`
  const apiURL = formatAdminURL({
    apiRoute,
    path: collectionSlug
      ? `/${collectionSlug}/${resolvedID}${apiQueryParams}`
      : globalSlug
        ? `/${globalSlug}${apiQueryParams}`
        : '',
  })

  const { isLivePreviewEnabled, livePreviewConfig, livePreviewURL } = await handleLivePreview({
    collectionSlug,
    config,
    data: resolvedData,
    globalSlug,
    operation,
    req,
  })

  const { isPreviewEnabled, previewURL } = await handlePreview({
    collectionSlug,
    config,
    data: resolvedData,
    globalSlug,
    operation,
    req,
  })

  return {
    id: resolvedID,
    apiURL,
    collectionSlug,
    currentEditor,
    docPermissions,
    globalSlug,
    hasDeletePermission,
    hasPublishedDoc,
    hasPublishPermission,
    hasSavePermission,
    hasTrashPermission,
    hideTabs: account,
    initialData: resolvedData,
    initialState: reduceToSerializableFields(state) as DocumentViewClientProps['formState'],
    isEditing: Boolean((collectionSlug && resolvedID) || globalSlug),
    isLivePreviewEnabled: isLivePreviewEnabled && operation !== 'create',
    isLocked,
    isPreviewEnabled: Boolean(isPreviewEnabled),
    isTrashed: Boolean(resolvedData && 'deletedAt' in resolvedData && resolvedData.deletedAt),
    lastUpdateTime,
    livePreviewBreakpoints: livePreviewConfig?.breakpoints,
    livePreviewURL,
    mostRecentVersionIsAutosaved,
    previewURL,
    typeofLivePreviewURL: typeof livePreviewConfig?.url as 'function' | 'string' | undefined,
    unpublishedVersionCount,
    versionCount,
  }
}
