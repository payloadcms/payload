import type { FieldTypes } from 'payload/config'
import type { FieldPermissions } from 'payload/auth'
import type { ArrayField } from 'payload/types'

export type Props = Omit<ArrayField, 'type'> & {
  fieldTypes: FieldTypes
  forceRender?: boolean
  indexPath: string
  label: false | string
  path?: string
  permissions: FieldPermissions
}
