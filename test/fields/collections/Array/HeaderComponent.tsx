import React from 'react';
import { CollapsibleLabel } from '../../../../src/admin/components/forms/CollapsibleLabel/types';

export const ArrayCollapsibleLabel: CollapsibleLabel = (props) => {
  const { collapsibleData, fallback } = props;
  return <span style={{ color: 'hotpink' }}>{collapsibleData.title || fallback}</span>;
};
