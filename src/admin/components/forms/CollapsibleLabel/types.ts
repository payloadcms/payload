import React from 'react';
import { Data } from '../Form/types';

export type CollapsibleHeader = (props: {
  formData: Data,
  collapsibleData: Data,
  index?: number,
  fallback: string,
}) => React.ReactNode;

export type Props = {
  fallback: string;
  path: string;
  header?: CollapsibleHeader;
  rowNumber?: number;
}
