import React from 'react';
import { Validate } from '../../../../../fields/config/types';
import { Description } from '../../FieldDescription/types';

export type Props = {
  autoComplete?: string
  path?: string
  name: string
  required?: boolean
  validate?: Validate
  style?: React.CSSProperties
  className?: string
  width?: string
  label?: string
  description?: Description
  disabled?: boolean
}
