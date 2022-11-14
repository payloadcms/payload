import React from 'react';
import { Data } from '../Form/types';

export type RowHeaderComponent = React.ComponentType<{
  value: Data;
  index?: number;
}>;

export type RowLabel = string | RowHeaderComponent;

export type Props = {
  fallback: React.ReactElement;
  path: string;
  header?: RowLabel;
  rowNumber?: number;
};

export function isComponent(RowLabel: RowLabel): RowLabel is RowHeaderComponent {
  return React.isValidElement(RowLabel);
}
