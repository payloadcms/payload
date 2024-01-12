import type { FieldTypes } from 'payload/config'
import type { FieldPermissions } from 'payload/auth'
import type { GroupField } from 'payload/types'

export type Props = Omit<GroupField, 'type'> & {
  fieldTypes: FieldTypes
  forceRender?: boolean
  indexPath: string
  path?: string
  permissions: FieldPermissions
}
