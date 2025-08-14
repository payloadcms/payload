import type {
  ClientCollectionConfig,
  ClientGlobalConfig,
  ClientUser,
  Data,
  DocumentPreferences,
  FormState,
  InsideFieldsPreferences,
  SanitizedCollectionConfig,
  SanitizedDocumentPermissions,
  SanitizedGlobalConfig,
  TypedUser,
} from 'payload'

import React from 'react'

import type { GetDocPermissions } from './useGetDocPermissions.js'

export type DocumentInfoProps = {
  readonly action?: string
  readonly AfterDocument?: React.ReactNode
  readonly AfterFields?: React.ReactNode
  readonly apiURL?: string
  readonly BeforeFields?: React.ReactNode
  readonly collectionSlug?: SanitizedCollectionConfig['slug']
  readonly currentEditor: TypedUser
  readonly disableActions?: boolean
  readonly disableCreate?: boolean
  readonly disableLeaveWithoutSaving?: boolean
  readonly docPermissions?: SanitizedDocumentPermissions
  readonly globalSlug?: SanitizedGlobalConfig['slug']
  readonly hasPublishedDoc: boolean
  readonly hasPublishPermission?: boolean
  readonly hasSavePermission?: boolean
  readonly id?: number | string
  readonly initialData?: Data
  readonly initialState?: FormState
  readonly isEditing?: boolean
  readonly isLocked: boolean
  readonly isTrashed?: boolean
  readonly lastUpdateTime: number
  readonly mostRecentVersionIsAutosaved: boolean
  readonly redirectAfterCreate?: boolean
  readonly redirectAfterDelete?: boolean
  readonly redirectAfterDuplicate?: boolean
  readonly redirectAfterRestore?: boolean
  readonly unpublishedVersionCount: number
  readonly Upload?: React.ReactNode
  readonly versionCount: number
}

export type DocumentInfoContext = {
  currentEditor?: ClientUser | null | number | string
  data?: Data
  docConfig?: ClientCollectionConfig | ClientGlobalConfig
  documentIsLocked?: boolean
  documentLockState: React.RefObject<{
    hasShownLockedModal: boolean
    isLocked: boolean
    user: ClientUser | number | string
  } | null>
  getDocPermissions: GetDocPermissions
  getDocPreferences: () => Promise<DocumentPreferences>
  incrementVersionCount: () => void
  isInitializing: boolean
  preferencesKey?: string
  /**
   * @deprecated This property is deprecated and will be removed in v4.
   * Use `data` instead.
   */
  savedDocumentData?: Data
  setCurrentEditor?: React.Dispatch<React.SetStateAction<ClientUser>>
  setData: (data: Data) => void
  setDocFieldPreferences: (
    field: string,
    fieldPreferences: { [key: string]: unknown } & Partial<InsideFieldsPreferences>,
  ) => void
  setDocumentIsLocked?: React.Dispatch<React.SetStateAction<boolean>>
  /**
   * @deprecated This property is deprecated and will be removed in v4.
   * This is for performance reasons. Use the `DocumentTitleContext` instead
   * via the `useDocumentTitle` hook.
   * @example
   * ```tsx
   * import { useDocumentTitle } from '@payloadcms/ui'
   * const { setDocumentTitle } = useDocumentTitle()
   * ```
   */
  setDocumentTitle: React.Dispatch<React.SetStateAction<string>>
  setHasPublishedDoc: React.Dispatch<React.SetStateAction<boolean>>
  setLastUpdateTime: React.Dispatch<React.SetStateAction<number>>
  setMostRecentVersionIsAutosaved: React.Dispatch<React.SetStateAction<boolean>>
  setUnpublishedVersionCount: React.Dispatch<React.SetStateAction<number>>
  setUploadStatus?: (status: 'failed' | 'idle' | 'uploading') => void
  /**
   * @deprecated This property is deprecated and will be removed in v4.
   * This is for performance reasons. Use the `DocumentTitleContext` instead
   * via the `useDocumentTitle` hook.
   * @example
   * ```tsx
   * import { useDocumentTitle } from '@payloadcms/ui'
   * const { title } = useDocumentTitle()
   * ```
   */
  title: string
  unlockDocument: (docID: number | string, slug: string) => Promise<void>
  unpublishedVersionCount: number
  updateDocumentEditor: (docID: number | string, slug: string, user: ClientUser) => Promise<void>
  /**
   * @deprecated This property is deprecated and will be removed in v4.
   * Use `setData` instead.
   */
  updateSavedDocumentData: (data: Data) => void
  uploadStatus?: 'failed' | 'idle' | 'uploading'
  versionCount: number
} & DocumentInfoProps

export const DocumentTitleContext = React.createContext<string>('')
