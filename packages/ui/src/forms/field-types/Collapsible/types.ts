import type { FieldTypes } from 'payload/config'
import type { FieldPermissions } from 'payload/auth'
import type { CollapsibleField } from 'payload/types'

export type Props = Omit<CollapsibleField, 'type'> & {
  fieldTypes: FieldTypes
  indexPath: string
  path?: string
  permissions: FieldPermissions
}
