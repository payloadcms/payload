import React from 'react';
import { Field } from '../../../../../../fields/config/types';
import { FieldPermissions } from '../../../../../../auth';

export type Props = {
  fieldComponents: Record<string, React.FC<Props>>
  revision: any
  comparison: any
  field: Field
  permissions?: Record<string, FieldPermissions>
  locale?: string
  locales?: string[]
  disableGutter?: boolean
}
