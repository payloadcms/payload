import type { FieldPermissions } from '../../../../auth/types'
import type { Field, FieldWithPath } from '../../../../fields/config/types'
import type { FieldTypes } from '../field-types'

export type Props = {
  className?: string
  fieldSchema: FieldWithPath[]
  fieldTypes: FieldTypes
  filter?: (field: Field) => boolean
  forceRender?: boolean
  indexPath?: string
  permissions?:
    | {
        [field: string]: FieldPermissions
      }
    | FieldPermissions
  readOnly?: boolean
}
