import type { FieldTypes } from '..'
import type { FieldPermissions } from '../../../../../auth/types'
import type { TabsField } from 'payload/types'

export type Props = Omit<TabsField, 'type'> & {
  fieldTypes: FieldTypes
  forceRender?: boolean
  indexPath: string
  path?: string
  permissions: FieldPermissions
}
