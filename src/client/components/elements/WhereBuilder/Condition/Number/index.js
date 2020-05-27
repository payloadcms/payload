import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'condition-value-number';

const NumberField = ({ onChange, value }) => {
  return (
    <input
      placeholder="Enter a value"
      className={baseClass}
      type="number"
      onChange={e => onChange(e.target.value)}
      value={value}
    />
  );
};

NumberField.defaultProps = {
  value: null,
};

NumberField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default NumberField;
