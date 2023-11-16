import type { FieldTypes } from '..'
import type { FieldPermissions } from '../../../../../auth/types'
import type { CollapsibleField } from '../../../../../fields/config/types'

export type Props = Omit<CollapsibleField, 'type'> & {
  fieldTypes: FieldTypes
  indexPath: string
  path?: string
  permissions: FieldPermissions
}
