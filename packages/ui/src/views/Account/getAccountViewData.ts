import type {
  ComponentRenderer,
  Data,
  DocumentPreferences,
  FormState,
  Locale,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedDocumentPermissions,
  TypedUser,
} from 'payload'

import { formatAdminURL } from 'payload/shared'

import { buildFormState } from '../../utilities/buildFormState.js'
import { getDocPreferences } from '../Document/getDocPreferences.js'
import { getDocumentData } from '../Document/getDocumentData.js'
import { getDocumentPermissions } from '../Document/getDocumentPermissions.js'
import { getIsLocked } from '../Document/getIsLocked.js'
import { getVersions } from '../Document/getVersions.js'

export type AccountViewData = {
  apiURL: string
  collectionConfig: SanitizedCollectionConfig
  currentEditor?: TypedUser
  data: Data
  docPermissions: SanitizedDocumentPermissions
  docPreferences: DocumentPreferences
  formState: FormState
  hasDeletePermission: boolean
  hasPublishedDoc: boolean
  hasPublishPermission: boolean
  hasSavePermission: boolean
  hasTrashPermission: boolean
  isLocked: boolean
  lastUpdateTime?: number
  mostRecentVersionIsAutosaved: boolean
  unpublishedVersionCount: number
  versionCount: number
}

export async function getAccountViewData({
  locale,
  renderComponent,
  req,
}: {
  locale: Locale
  renderComponent: ComponentRenderer
  req: PayloadRequest
}): Promise<AccountViewData> {
  const {
    payload,
    payload: { config },
    user,
  } = req

  const {
    admin: { user: userSlug },
    routes: { api },
  } = config

  const collectionConfig = payload?.collections?.[userSlug]?.config

  if (!collectionConfig || !user?.id) {
    throw new Error('not-found')
  }

  const data = await getDocumentData({
    id: user.id,
    collectionSlug: collectionConfig.slug,
    locale,
    payload,
    req,
    user,
  })

  if (!data) {
    throw new Error('not-found')
  }

  const docPreferences = await getDocPreferences({
    id: user.id,
    collectionSlug: collectionConfig.slug,
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
    id: user.id,
    collectionConfig,
    data,
    req,
  })

  const { state: formState } = await buildFormState(
    {
      id: user.id,
      collectionSlug: collectionConfig.slug,
      data,
      docPermissions,
      docPreferences,
      locale: locale?.code,
      operation: 'update',
      renderAllFields: true,
      req,
      schemaPath: collectionConfig.slug,
      skipValidation: true,
    },
    renderComponent,
  )

  const { currentEditor, isLocked, lastUpdateTime } = await getIsLocked({
    id: user.id,
    collectionConfig,
    isEditing: true,
    req,
  })

  const { hasPublishedDoc, mostRecentVersionIsAutosaved, unpublishedVersionCount, versionCount } =
    await getVersions({
      id: user.id,
      collectionConfig,
      doc: data,
      docPermissions,
      locale: locale?.code,
      payload,
      user,
    })

  const apiURL = formatAdminURL({
    apiRoute: api,
    path: `/${userSlug}${user?.id ? `/${user.id}` : ''}`,
  })

  return {
    apiURL,
    collectionConfig,
    currentEditor,
    data,
    docPermissions,
    docPreferences,
    formState,
    hasDeletePermission,
    hasPublishedDoc,
    hasPublishPermission,
    hasSavePermission,
    hasTrashPermission,
    isLocked,
    lastUpdateTime,
    mostRecentVersionIsAutosaved,
    unpublishedVersionCount,
    versionCount,
  }
}
