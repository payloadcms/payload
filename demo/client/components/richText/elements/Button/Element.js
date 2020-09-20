import React from 'react';
import PropTypes from 'prop-types';

const ButtonElement = ({ attributes, children }) => (
  <span
    {...attributes}
    style={{ backgroundColor: 'black', color: 'white' }}
  >
    {children}
  </span>
);

ButtonElement.defaultProps = {
  attributes: {},
  children: null,
};

ButtonElement.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

export default ButtonElement;
