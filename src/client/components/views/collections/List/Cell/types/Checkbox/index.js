import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

// Handles boolean values
const Checkbox = ({ data }) => (
  <code className="bool-cell">
    <span>{JSON.stringify(data)}</span>
  </code>
);

Checkbox.defaultProps = {
  data: undefined,
};

Checkbox.propTypes = {
  data: PropTypes.bool,
};

export default Checkbox;
