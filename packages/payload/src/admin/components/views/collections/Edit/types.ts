import type React from 'react'

import type { CollectionPermission } from '../../../../../auth/types'
import type { SanitizedCollectionConfig } from '../../../../../collections/config/types'
import type { Document } from '../../../../../types'
import type { Fields } from '../../../forms/Form/types'

export type IndexProps = {
  collection: SanitizedCollectionConfig
  isEditing?: boolean
}

export type CollectionEditViewProps = IndexProps & {
  action: string
  apiURL: string
  autosaveEnabled: boolean
  customHeader?: React.ReactNode
  data: Document
  disableActions?: boolean
  disableLeaveWithoutSaving?: boolean
  disableRoutes?: boolean
  hasSavePermission: boolean
  id?: string
  internalState?: Fields
  isLoading: boolean
  onSave?: (
    json: Record<string, unknown> & {
      collectionConfig: SanitizedCollectionConfig
      doc: Record<string, any>
      message: string
      operation: 'create' | 'update'
    },
  ) => void
  permissions: CollectionPermission
  updatedAt?: string
}
