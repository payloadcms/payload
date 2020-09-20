import React from 'react';
import PropTypes from 'prop-types';

const Strikethrough = ({ attributes, children }) => (
  <span
    {...attributes}
    style={{ textDecoration: 'line-through' }}
  >
    {children}
  </span>
);

Strikethrough.defaultProps = {
  attributes: {},
  children: null,
};

Strikethrough.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

export default Strikethrough;
