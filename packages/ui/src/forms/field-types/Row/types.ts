import type { FieldTypes } from '..'
import type { FieldPermissions } from 'payload/auth'
import type { RowField } from 'payload/types'

export type Props = Omit<RowField, 'type'> & {
  fieldTypes: FieldTypes
  forceRender?: boolean
  indexPath: string
  path?: string
  permissions: FieldPermissions
}
