import React from 'react';
import { Description, Validate } from '../../../../../fields/config/types';

export type Props = {
  autoComplete?: string
  path?: string
  name: string
  required?: boolean
  validate?: Validate
  style?: React.CSSProperties
  width?: string
  label?: string
  description?: Description
}
