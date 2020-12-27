import React from 'react';

const ArrayCell = ({ data, field }) => {
  const arrayFields = data ?? [];
  const label = `${arrayFields.length} ${field.label} rows`;

  return (
    <span>{label}</span>
  );
};

export default ArrayCell;
