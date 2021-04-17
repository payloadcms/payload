import React from 'react';
import { ArrayField } from '../../../../../../../../fields/config/types';

type Props = {
  data: Record<string, unknown>
  field: ArrayField
}

const ArrayCell: React.FC<Props> = ({ data, field }) => {
  const arrayFields = data ?? [];
  const label = `${arrayFields.length} ${field?.labels?.plural || 'Rows'}`;

  return (
    <span>{label}</span>
  );
};

export default ArrayCell;
