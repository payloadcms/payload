import React from 'react';

import H2Icon from '../../../../../icons/headings/H2/index.js';
import ElementButton from '../Button.js';

const H2 = ({ attributes, children }) => (
  <h2 {...attributes}>{children}</h2>
);

const h2 = {
  Button: () => (
    <ElementButton format="h2">
      <H2Icon />
    </ElementButton>
  ),
  Element: H2,
};

export default h2;
