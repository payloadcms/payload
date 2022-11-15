import React from 'react';
import { RowLabelComponent } from '../../../../src/admin/components/forms/RowLabel/types';

export const ArrayRowLabel: RowLabelComponent = (props) => {
  const { data, fallback } = props;
  return <div style={{ color: 'hotpink' }}>{data.title || fallback}</div>;
};
