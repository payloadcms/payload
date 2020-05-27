import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const Text = ({ onChange, value }) => {
  return (
    <input
      type="text"
      onChange={onChange}
      value={value}
    />
  );
};

Text.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

export default Text;
