import React from 'react';
import { RowLabelComponent } from '../../../../src/admin/components/forms/RowLabel/types';

export const CollapsibleLabelComponent: RowLabelComponent = (props) => {
  const { data, fallback } = props;
  return <div style={{ textTransform: 'uppercase' }}>{data.componentTitleField || fallback}</div>;
};
