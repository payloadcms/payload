import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const DateField = ({ onChange, value }) => {
  return (
    <input
      type="text"
      onChange={onChange}
      value={value}
    />
  );
};

DateField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

export default DateField;
