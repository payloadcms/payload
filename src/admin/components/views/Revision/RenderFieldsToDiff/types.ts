import { FieldPermissions } from '../../../../../auth';
import { Field } from '../../../../../fields/config/types';

export type Props = {
  fields: Field[]
  fieldPermissions: Record<string, FieldPermissions>
  revision: Record<string, any>
  comparison: Record<string, any>
  locales: string[]
}
