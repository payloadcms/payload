import type { FieldTypes } from '..'
import type { FieldPermissions } from '../../../../../auth/types'
import type { ArrayField } from '../../../../../fields/config/types'

export type Props = Omit<ArrayField, 'type'> & {
  fieldTypes: FieldTypes
  forceRender?: boolean
  indexPath: string
  label: false | string
  path?: string
  permissions: FieldPermissions
}
