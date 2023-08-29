import type { FieldPermissions } from '../../../../../auth/types.js';
import type { BlockField } from '../../../../../fields/config/types.js';
import type { FieldTypes } from '../index.js';

export type Props = Omit<BlockField, 'type'> & {
  fieldTypes: FieldTypes
  indexPath: string
  path?: string
  permissions: FieldPermissions
}
