import React from 'react';
import PropTypes from 'prop-types';
import ElementButton from '../Button';
import H6Icon from '../../../../../icons/headings/H6';

const H6 = ({ attributes, children }) => (
  <h6 {...attributes}>{children}</h6>
);

H6.defaultProps = {
  attributes: {},
  children: null,
};

H6.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

const h6 = {
  button: () => (
    <ElementButton format="h6">
      <H6Icon />
    </ElementButton>
  ),
  element: H6,
};

export default h6;
