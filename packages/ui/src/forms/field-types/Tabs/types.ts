import type { FieldTypes } from 'payload/config'
import type { FieldPermissions } from 'payload/auth'
import type { TabsField } from 'payload/types'

export type Props = Omit<TabsField, 'type'> & {
  fieldTypes: FieldTypes
  forceRender?: boolean
  indexPath: string
  path?: string
  permissions: FieldPermissions
}
