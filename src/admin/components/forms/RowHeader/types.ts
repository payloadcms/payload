import React from 'react';
import { Data } from '../Form/types';

export type RowHeaderFunction = (value: Data, index?: number) => React.ReactNode;

export type RowHeaderComponent = React.ComponentType<{
  value: Data;
  index?: number;
}>;

export type RowHeader = string | RowHeaderComponent | RowHeaderFunction;

export type Props = {
  fallback: string | React.ReactElement;
  path: string;
  header?: RowHeader;
  rowNumber?: number;
};

export function isComponent(RowLabel: RowHeader): RowLabel is RowHeaderComponent {
  return React.isValidElement(RowLabel);
}
