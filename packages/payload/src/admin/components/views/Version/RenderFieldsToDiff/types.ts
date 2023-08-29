import { FieldPermissions } from '../../../../../auth/types.js';
import { Field } from '../../../../../fields/config/types.js';
import { FieldComponents } from './fields/types.js';

export type Props = {
  fields: Field[]
  fieldComponents: FieldComponents,
  fieldPermissions: Record<string, FieldPermissions>
  version: Record<string, any>
  comparison: Record<string, any>
  locales: string[]
}
