import type {
  ClientCollectionConfig,
  ClientGlobalConfig,
  Data,
  DocumentPreferences,
  FormState,
  InsideFieldsPreferences,
  SanitizedCollectionConfig,
  SanitizedDocumentPermissions,
  SanitizedGlobalConfig,
  UploadTransferProgress,
  User,
} from 'payload'

import React from 'react'

import type { GetDocPermissions } from './useGetDocPermissions.js'

/**
 * Progress of the file upload in the current save. Processing is shown while `status` is
 * `uploading` and all bytes are sent.
 * @experimental
 */
export type UploadProgress = {
  status: 'failed' | 'success' | 'uploading'
} & UploadTransferProgress

export type DocumentInfoProps = {
  readonly action?: string
  readonly AfterDocument?: React.ReactNode
  readonly AfterFields?: React.ReactNode
  readonly apiURL?: string
  readonly BeforeFields?: React.ReactNode
  readonly collectionSlug?: SanitizedCollectionConfig['slug']
  readonly currentEditor: User
  readonly disableActions?: boolean
  readonly disableCreate?: boolean
  readonly disableLeaveWithoutSaving?: boolean
  readonly docPermissions?: SanitizedDocumentPermissions
  readonly globalSlug?: SanitizedGlobalConfig['slug']
  /**
   * Whether the user can permanently delete documents when trash is enabled.
   * Determined by checking delete access with `deletedAt` set.
   */
  readonly hasDeletePermission?: boolean
  readonly hasPublishedDoc: boolean
  readonly hasPublishPermission?: boolean
  readonly hasSavePermission?: boolean
  /** Whether the document or global has an upcoming scheduled publish/unpublish job. */
  readonly hasScheduledPublish?: boolean
  /** Whether the user can trash (soft delete) documents. Only applicable when `trash` is enabled. */
  readonly hasTrashPermission?: boolean
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
  currentEditor?: null | number | string | User
  data?: Data
  docConfig?: ClientCollectionConfig | ClientGlobalConfig
  documentIsLocked?: boolean
  documentLockState: React.RefObject<{
    hasShownLockedModal: boolean
    isLocked: boolean
    user: number | string | User
  } | null>
  getDocPermissions: GetDocPermissions
  getDocPreferences: () => Promise<DocumentPreferences>
  hasScheduledPublish: boolean
  incrementVersionCount: () => void
  isInitializing: boolean
  /** `true` once a form-state request finds the document was changed by someone else since it loaded. */
  isStale: boolean
  preferencesKey?: string
  setCurrentEditor?: React.Dispatch<React.SetStateAction<User>>
  setData: (data: Data) => void
  setDocFieldPreferences: (
    field: string,
    fieldPreferences: { [key: string]: unknown } & Partial<InsideFieldsPreferences>,
  ) => void
  setDocumentIsLocked?: React.Dispatch<React.SetStateAction<boolean>>
  setHasPublishedDoc: React.Dispatch<React.SetStateAction<boolean>>
  setHasScheduledPublish: React.Dispatch<React.SetStateAction<boolean>>
  setIsStale: React.Dispatch<React.SetStateAction<boolean>>
  setLastUpdateTime: React.Dispatch<React.SetStateAction<number>>
  setMostRecentVersionIsAutosaved: React.Dispatch<React.SetStateAction<boolean>>
  setUnpublishedVersionCount: React.Dispatch<React.SetStateAction<number>>
  /** @internal Set by Payload while a save uploads a file. */
  setUploadProgress?: React.Dispatch<React.SetStateAction<undefined | UploadProgress>>
  setUploadStatus?: (status: 'failed' | 'idle' | 'uploading') => void
  unlockDocument: (docID: number | string, slug: string) => Promise<void>
  unpublishedVersionCount: number
  updateDocumentEditor: (docID: number | string, slug: string, user: User) => Promise<void>
  /**
   * Progress of the file upload in the current save. Undefined until a save uploads a file.
   * @experimental
   */
  uploadProgress?: UploadProgress
  /** `uploading` while a save uploads a file. */
  uploadStatus?: 'failed' | 'idle' | 'uploading'
  versionCount: number
} & DocumentInfoProps

export const DocumentTitleContext = React.createContext<string>('')
