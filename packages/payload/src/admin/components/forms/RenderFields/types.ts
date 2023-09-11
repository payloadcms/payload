import type { FieldPermissions } from '../../../../auth/types'
import type { Field, FieldWithPath } from '../../../../fields/config/types'
import type { FieldTypes } from '../field-types'

export type Props = {
  className?: string
  /** Function which returns the component for a field */
  fieldComponentProvider: (field: FieldWithPath) => React.ComponentType<any>
  fieldSchema: FieldWithPath[]
  filter?: (field: Field) => boolean
  forceRender?: boolean
  indexPath?: string
  permissions?:
    | {
        [field: string]: FieldPermissions
      }
    | FieldPermissions
  readOnly?: boolean
  /** Map of field types to their component */
  staticFieldTypes: FieldTypes
}
