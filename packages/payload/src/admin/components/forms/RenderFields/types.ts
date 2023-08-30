import type { FieldPermissions } from '../../../../auth/types.js'
import type { Field, FieldWithPath } from '../../../../fields/config/types.js'
import type { FieldTypes } from '../field-types/index.js'

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
