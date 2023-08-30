import React from 'react';

import H3Icon from '../../../../../icons/headings/H3/index.js';
import ElementButton from '../Button.js';

const H3 = ({ attributes, children }) => (
  <h3 {...attributes}>{children}</h3>
);

const h3 = {
  Button: () => (
    <ElementButton format="h3">
      <H3Icon />
    </ElementButton>
  ),
  Element: H3,
};

export default h3;
