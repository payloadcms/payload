import React from 'react';
import { RowLabel } from '../../../../src/admin/components/forms/RowLabel/types';

export const CollapsibleLabelComponent: RowLabel = (props) => {
  const { data, fallback } = props;
  return <span style={{ color: 'coral' }}>{data.componentTitleField || fallback}</span>;
};
