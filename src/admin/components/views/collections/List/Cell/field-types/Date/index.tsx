import React from 'react';
import format from 'date-fns/format';

const DateCell = ({ data }) => (
  <span>
    {data && format(new Date(data), 'MMMM do yyyy, h:mm a')}
  </span>
);

export default DateCell;
