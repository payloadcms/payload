import React from 'react';
import PropTypes from 'prop-types';
import format from 'date-fns/format';

const DateCell = ({ data }) => (
  <span>
    {data && format(new Date(data), 'MMMM do yyyy, h:mm a')}
  </span>
);

DateCell.defaultProps = {
  data: undefined,
};

DateCell.propTypes = {
  data: PropTypes.string,
};

export default DateCell;
