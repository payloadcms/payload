import React from 'react';
import PropTypes from 'prop-types';
import format from 'date-fns/format';

const DateCell = ({ data }) => (
  <span>
    {format(new Date(data), 'MMMM do yyyy, h:mm a')}
  </span>
);

DateCell.propTypes = {
  data: PropTypes.string.isRequired,
};

export default DateCell;
