import { FieldPermissions } from '../../../../auth/types';
import { FieldWithPath, Field } from '../../../../fields/config/types';
import { FieldTypes } from '../field-types';

export type Operation = 'create' | 'update'

export type Context = {
  operation: Operation
}

export type Props = {
  className?: string
  operation: Operation
  readOnly: boolean
  permissions: FieldPermissions
  filter?: (field: Field) => boolean
  fieldSchema: FieldWithPath[]
  fieldTypes: FieldTypes
}
