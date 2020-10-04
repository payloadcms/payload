import React from 'react';
import PropTypes from 'prop-types';
import ElementButton from '../Button';
import H5Icon from '../../../../../icons/headings/H5';

const H5 = ({ attributes, children }) => (
  <h5 {...attributes}>{children}</h5>
);

H5.defaultProps = {
  attributes: {},
  children: null,
};

H5.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

const h5 = {
  Button: () => (
    <ElementButton format="h5">
      <H5Icon />
    </ElementButton>
  ),
  Element: H5,
};

export default h5;
