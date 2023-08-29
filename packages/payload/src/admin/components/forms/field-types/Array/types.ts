import type { FieldPermissions } from '../../../../../auth/types.js'
import type { ArrayField } from '../../../../../fields/config/types.js'
import type { FieldTypes } from '../index.js'

export type Props = Omit<ArrayField, 'type'> & {
  fieldTypes: FieldTypes
  indexPath: string
  label: false | string
  path?: string
  permissions: FieldPermissions
}
