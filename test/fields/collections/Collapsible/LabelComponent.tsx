import React from 'react';
import { RowLabelComponent } from '../../../../src/admin/components/forms/RowLabel/types';

export const CollapsibleLabelComponent: RowLabelComponent = (props) => {
  const { data, fallback } = props;
  return <span style={{ color: 'coral' }}>{data.componentTitleField || fallback}</span>;
};
