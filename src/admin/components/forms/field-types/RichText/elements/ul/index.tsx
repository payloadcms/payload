import React from 'react';
import ULIcon from '../../../../../icons/UnorderedList';
import ListButton from '../ListButton';

const UL = ({ attributes, children }) => (
  <ul {...attributes}>{children}</ul>
);

const ul = {
  Button: () => (
    <ListButton format="ul">
      <ULIcon />
    </ListButton>
  ),
  Element: UL,
};

export default ul;
