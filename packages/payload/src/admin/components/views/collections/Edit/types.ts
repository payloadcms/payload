import type React from 'react'

import type { CollectionPermission } from '../../../../../auth/types'
import type { SanitizedCollectionConfig } from '../../../../../collections/config/types'
import type { Document } from '../../../../../types'
import type { Fields } from '../../../forms/Form/types'

export type IndexProps = {
  collection: SanitizedCollectionConfig
  isEditing?: boolean
}

export type Props = IndexProps & {
  action: string
  apiURL: string
  autosaveEnabled: boolean
  customHeader?: React.ReactNode
  data: Document
  disableActions?: boolean
  disableEyebrow?: boolean
  disableLeaveWithoutSaving?: boolean
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
  setFocalPoint?: (focalPoint: { x: number; y: number }) => void
  permissions: CollectionPermission
  updatedAt?: string
}
