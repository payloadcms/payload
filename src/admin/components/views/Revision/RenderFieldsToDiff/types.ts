import React from 'react';
import { FieldPermissions } from '../../../../../auth';
import { Field } from '../../../../../fields/config/types';
import { Props as FieldProps } from './fields/types';

export type Props = {
  fields: Field[]
  fieldComponents: Record<string, React.FC<FieldProps>>
  fieldPermissions: Record<string, FieldPermissions>
  revision: Record<string, any>
  comparison: Record<string, any>
  locales: string[]
}
