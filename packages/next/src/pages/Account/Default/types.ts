import type { CollectionPermission } from 'payload/auth'
import type { SanitizedCollectionConfig, SanitizedConfig } from 'payload/types'
import type { Data, Fields, FieldTypes } from '@payloadcms/ui'

export type DefaultAccountViewProps = {
  action: string
  apiURL: string
  config: SanitizedConfig
  collectionConfig: SanitizedCollectionConfig
  data: Data
  hasSavePermission: boolean
  initialState: Fields
  isLoading: boolean
  onSave?: () => void
  permissions: CollectionPermission
  fieldTypes: FieldTypes
}
