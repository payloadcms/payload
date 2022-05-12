import React from 'react';
import format from 'date-fns/format';
import { useConfig } from '../../../../../../utilities/Config';

const DateCell = ({ data }) => {
  const { admin: { dateFormat } } = useConfig();

  return (
    <span>
      {data && format(new Date(data), dateFormat)}
    </span>
  );
};

export default DateCell;
