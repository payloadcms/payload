import { ArrayField } from '../../../../../fields/config/types';
import { FieldTypes } from '../types';
import { FieldPermissions } from '../../../../../auth/types';

export type Props = Omit<ArrayField, 'type'> & {
  path?: string
  fieldTypes: FieldTypes
  permissions: FieldPermissions
  label: string | false
  indexPath: string
}
