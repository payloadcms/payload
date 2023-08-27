import { CollapsibleField } from '../../../../../fields/config/types.js';
import { FieldTypes } from '..';
import { FieldPermissions } from '../../../../../auth/types.js';

export type Props = Omit<CollapsibleField, 'type'> & {
  path?: string
  fieldTypes: FieldTypes
  permissions: FieldPermissions
  indexPath: string
}
