import type { CollectionPermission } from 'payload/auth'
import type { SanitizedCollectionConfig, SanitizedConfig } from 'payload/types'
import type { Data, Fields } from '../../forms/Form/types'
import { FieldTypes } from '../../forms/field-types'

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
