import type { FieldPermissions } from '../../../../../auth/types.js'
import type { TabsField } from '../../../../../fields/config/types.js'
import type { FieldTypes } from '../index.js'

export type Props = Omit<TabsField, 'type'> & {
  fieldTypes: FieldTypes
  indexPath: string
  path?: string
  permissions: FieldPermissions
}
