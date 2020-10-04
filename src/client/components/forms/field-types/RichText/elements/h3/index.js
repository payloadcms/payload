import React from 'react';
import PropTypes from 'prop-types';
import ElementButton from '../Button';
import H3Icon from '../../../../../icons/headings/H3';

const H3 = ({ attributes, children }) => (
  <h3 {...attributes}>{children}</h3>
);

H3.defaultProps = {
  attributes: {},
  children: null,
};

H3.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

const h3 = {
  Button: () => (
    <ElementButton format="h3">
      <H3Icon />
    </ElementButton>
  ),
  Element: H3,
};

export default h3;
