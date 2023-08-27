import { ArrayField } from '../../../../../fields/config/types.js';
import { FieldTypes } from '../index.js';
import { FieldPermissions } from '../../../../../auth/types.js';

export type Props = Omit<ArrayField, 'type'> & {
  path?: string
  fieldTypes: FieldTypes
  permissions: FieldPermissions
  label: string | false
  indexPath: string
}
