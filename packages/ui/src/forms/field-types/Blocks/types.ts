import type { FieldTypes } from '..'
import type { FieldPermissions } from 'payload/auth'
import type { BlockField } from 'payload/types'

export type Props = Omit<BlockField, 'type'> & {
  fieldTypes: FieldTypes
  forceRender?: boolean
  indexPath: string
  path?: string
  permissions: FieldPermissions
}
