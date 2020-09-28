import React from 'react';
import PropTypes from 'prop-types';
import ElementButton from '../Button';
import H4Icon from '../../../../../icons/headings/H4';

const H4 = ({ attributes, children }) => (
  <h4 {...attributes}>{children}</h4>
);

H4.defaultProps = {
  attributes: {},
  children: null,
};

H4.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

const h4 = {
  button: () => (
    <ElementButton format="h4">
      <H4Icon />
    </ElementButton>
  ),
  element: H4,
};

export default h4;
