import React from 'react';
import PropTypes from 'prop-types';

const PurpleBackground: React.FC<any> = ({ attributes, children }) => (
  <span
    {...attributes}
    style={{ backgroundColor: 'purple' }}
  >
    {children}
  </span>
);

PurpleBackground.defaultProps = {
  attributes: {},
  children: null,
};

PurpleBackground.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

export default PurpleBackground;
