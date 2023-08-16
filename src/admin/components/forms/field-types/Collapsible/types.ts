import { CollapsibleField } from '../../../../../fields/config/types';
import { FieldTypes } from '../types';
import { FieldPermissions } from '../../../../../auth/types';

export type Props = Omit<CollapsibleField, 'type'> & {
  path?: string
  fieldTypes: FieldTypes
  permissions: FieldPermissions
  indexPath: string
}
