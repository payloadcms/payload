import React from 'react';
import PropTypes from 'prop-types';
import ElementButton from '../Button';
import ULIcon from '../../../../../icons/UnorderedList';

const UL = ({ attributes, children }) => (
  <ul {...attributes}>{children}</ul>
);

UL.defaultProps = {
  attributes: {},
  children: null,
};

UL.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

const ul = {
  Button: () => (
    <ElementButton format="ul">
      <ULIcon />
    </ElementButton>
  ),
  Element: UL,
};

export default ul;
