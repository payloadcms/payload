import { FieldPermissions } from '../../../../auth/types.js';
import { FieldWithPath, Field } from '../../../../fields/config/types.js';
import { FieldTypes } from '../field-types.js';

export type Props = {
  className?: string
  readOnly?: boolean
  forceRender?: boolean
  permissions?: FieldPermissions | {
    [field: string]: FieldPermissions
  }
  filter?: (field: Field) => boolean
  fieldSchema: FieldWithPath[]
  fieldTypes: FieldTypes
  indexPath?: string
}
