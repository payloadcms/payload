import type { FieldPermissions } from '../../../../auth/types'
import type { Field, FieldWithPath } from '../../../../fields/config/types'
import type { FieldTypes } from '../field-types'
import type { ReducedField } from './filterFields'

export type Props = {
  className?: string
  fieldTypes: FieldTypes
  margins?: 'small'
  forceRender?: boolean
} & (
  | {
      fieldSchema: FieldWithPath[]
      filter?: (field: Field) => boolean
      indexPath?: string
      permissions?:
        | {
            [field: string]: FieldPermissions
          }
        | FieldPermissions
      readOnly?: boolean
    }
  | {
      fields: ReducedField[]
    }
)
