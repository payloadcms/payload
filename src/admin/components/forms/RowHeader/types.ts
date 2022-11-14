import React from 'react';
import { Data } from '../Form/types';

export type RowHeaderComponent = (props: {value: Data, index?: number}) => React.ReactNode;

export type RowHeader = string | RowHeaderComponent;

export type Props = {
  fallback: string | React.ReactElement;
  path: string;
  header?: RowHeader;
  rowNumber?: number;
}
