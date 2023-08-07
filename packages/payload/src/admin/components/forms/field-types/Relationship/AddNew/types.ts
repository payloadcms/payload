import React from 'react';
import { Action, OptionGroup, Value } from '../types';

export type Props = {
  hasMany: boolean
  relationTo: string | string[]
  path: string
  value: Value | Value[]
  options: OptionGroup[]
  setValue: (value: unknown) => void
  dispatchOptions: React.Dispatch<Action>
}
