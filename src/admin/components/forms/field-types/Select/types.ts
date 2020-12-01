import React from 'react';
import { Validate } from '../../../../../fields/config/types';

export type Props = {
  path?: string
  name: string
  required?: boolean
  validate?: Validate
  label?: string
  options?: string[] | { label: string, value: string }[]
  hasMany?: boolean
  admin?: {
    readOnly?: boolean
    width?: string
    style?: React.CSSProperties
  }
}
