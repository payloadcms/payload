import type { FieldPermissions } from '../../../../../auth/types.js';
import type { Field } from '../../../../../fields/config/types.js';
import type { FieldComponents } from './fields/types.js';

export type Props = {
  comparison: Record<string, any>
  fieldComponents: FieldComponents,
  fieldPermissions: Record<string, FieldPermissions>
  fields: Field[]
  locales: string[]
  version: Record<string, any>
}
