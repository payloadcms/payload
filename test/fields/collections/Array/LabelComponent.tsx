import React from 'react';
import { RowLabelComponent } from '../../../../src/admin/components/forms/RowLabel/types';

export const ArrayRowLabel: RowLabelComponent = (props) => {
  const { data } = props;
  return <div style={{ textTransform: 'uppercase' }}>{data.title || 'Untitled'}</div>;
};
