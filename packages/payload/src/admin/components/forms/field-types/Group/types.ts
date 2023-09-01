import type { FieldTypes } from '..';
import type { FieldPermissions } from '../../../../../auth/types';
import type { GroupField } from '../../../../../fields/config/types';

export type Props = Omit<GroupField, 'type'> & {
  fieldTypes: FieldTypes
  indexPath: string
  path?: string
  permissions: FieldPermissions
}
