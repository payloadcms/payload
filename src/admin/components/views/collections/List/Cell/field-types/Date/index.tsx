import React from 'react';
import format from 'date-fns/format';
import { useConfig } from '../../../../../../utilities/Config';

const DateCell = ({ data, field }) => {
  const { admin: { dateFormat: dateFormatFromConfig } } = useConfig();

  const dateFormat = field?.admin?.date?.displayFormat || dateFormatFromConfig;

  return (
    <span>
      {data && format(new Date(data), dateFormat)}
    </span>
  );
};

export default DateCell;
