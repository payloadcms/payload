import React from 'react';
import { SanitizedCollectionConfig } from '../../../../../collections/config/types';
import { CollectionPermission } from '../../../../../auth/types';
import { Document } from '../../../../../types';
import { Fields } from '../../../forms/Form/types';

export type IndexProps = {
  collection: SanitizedCollectionConfig
  isEditing?: boolean
}

export type Props = IndexProps & {
  data: Document
  onSave?: (json: Record<string, unknown> & {
    doc: Record<string, any>
    message: string
    collectionConfig: SanitizedCollectionConfig
    operation: 'create' | 'update',
  }) => void
  id?: string
  permissions: CollectionPermission
  isLoading: boolean
  internalState?: Fields
  apiURL: string
  action: string
  hasSavePermission: boolean
  autosaveEnabled: boolean
  disableEyebrow?: boolean
  disableActions?: boolean
  disableLeaveWithoutSaving?: boolean
  customHeader?: React.ReactNode
  updatedAt?: string
}
