import React from 'react';
import PropTypes from 'prop-types';

const LI = ({ attributes, children }) => (
  <li {...attributes}>{children}</li>
);

LI.defaultProps = {
  attributes: {},
  children: null,
};

LI.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

export default {
  Element: LI,
};
