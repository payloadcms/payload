import React from 'react';
import ElementButton from '../Button';
import ULIcon from '../../../../../icons/UnorderedList';

const UL = ({ attributes, children }) => (
  <ul {...attributes}>{children}</ul>
);

const ul = {
  Button: () => (
    <ElementButton format="ul">
      <ULIcon />
    </ElementButton>
  ),
  Element: UL,
};

export default ul;
