import React from 'react';
import { Data } from '../Form/types';

export type RowLabelFunction = (value: Data, index?: number) => React.ReactNode

export type RowLabelComponent = React.ComponentType<{ value: Data, index?: number }>

export type RowLabel = string | RowLabelFunction | RowLabelComponent

export type Props = {
  fallback: React.ReactElement
  path: string
  header?: RowLabel
  rowNumber?: number
}

export function isComponent(RowLabel: RowLabel): RowLabel is RowLabelComponent {
  return React.isValidElement(RowLabel);
}
