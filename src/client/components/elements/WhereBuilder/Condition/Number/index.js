import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const NumberField = ({ onChange, value }) => {
  return (
    <input
      type="number"
      onChange={onChange}
      value={value}
    />
  );
};

NumberField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

export default NumberField;
