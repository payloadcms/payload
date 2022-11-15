import React from 'react';
import { CollapsibleLabel } from '../../../../src/admin/components/forms/CollapsibleLabel/types';

export const CollapsibleLabelComponent: CollapsibleLabel = (props) => {
  const { collapsibleData, fallback } = props;
  return <span style={{ color: 'coral' }}>{collapsibleData.componentTitleField || fallback}</span>;
};
