import type { FieldPermissions } from '../../../../auth/types'
import type { Field, FieldWithPath } from '../../../../fields/config/types'
import type { FieldTypes } from '../field-types'
import type { ReducedField } from './filterFields'

export type Props = {
  className?: string
  fieldTypes: FieldTypes
  forceRender?: boolean
  margins?: 'small' | false
  permissions:
    | {
        [field: string]: FieldPermissions
      }
    | FieldPermissions
  readOnly?: boolean
} & (
  | {
      fieldSchema: FieldWithPath[]
      filter?: (field: Field) => boolean
      indexPath?: string
    }
  | {
      fields: ReducedField[]
    }
)
