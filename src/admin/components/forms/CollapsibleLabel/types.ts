import React from 'react';
import { Data } from '../Form/types';

export type CollapsibleLabel = (props: {
  formData: Data,
  collapsibleData: Data,
  index?: number,
  fallback: string,
}) => React.ReactNode;

export type Props = {
  fallback: string;
  path: string;
  label?: CollapsibleLabel;
  rowNumber?: number;
}
