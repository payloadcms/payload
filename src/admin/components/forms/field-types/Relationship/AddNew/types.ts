import React from 'react';
import { Action, OptionGroup, Value } from '../types';
import { GetOptionLabel } from '../../../../../../fields/config/types';

export type Props = {
  hasMany: boolean
  relationTo: string | string[]
  path: string
  value: Value | Value[]
  options: OptionGroup[]
  setValue: (value: unknown) => void
  dispatchOptions: React.Dispatch<Action>
  getOptionLabel: GetOptionLabel
}
