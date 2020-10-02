import React from 'react';
import PropTypes from 'prop-types';

const baseClass = 'bool-cell';

// Handles boolean values
const Checkbox = ({ data }) => (
  <code className={`${baseClass}--style`}>
    <span>{JSON.stringify(data)}</span>
  </code>
);

Checkbox.defaultProps = {
  data: '',
};

Checkbox.propTypes = {
  data: PropTypes.bool,
};

export default Checkbox;
