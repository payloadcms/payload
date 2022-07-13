import { FieldPermissions } from '../../../../auth/types';
import { FieldWithPath, Field } from '../../../../fields/config/types';
import { FieldTypes } from '../field-types';

export type Props = {
  className?: string
  readOnly?: boolean
  forceRender?: boolean
  permissions?: {
    [field: string]: FieldPermissions
  }
  filter?: (field: Field) => boolean
  fieldSchema: FieldWithPath[]
  fieldTypes: FieldTypes
}
