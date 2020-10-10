import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'condition-value-text';

const Text = ({ onChange, value }) => {
  return (
    <input
      placeholder="Enter a value"
      className={baseClass}
      type="text"
      onChange={e => onChange(e.target.value)}
      value={value}
    />
  );
};

Text.defaultProps = {
  value: '',
};

Text.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default Text;
