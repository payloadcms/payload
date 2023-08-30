import React from 'react';

import ULIcon from '../../../../../icons/UnorderedList/index.js';
import ListButton from '../ListButton.js';
import './index.scss';

const UL = ({ attributes, children }) => (
  <ul
    className="rich-text-ul"
    {...attributes}
  >
    {children}
  </ul>
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
