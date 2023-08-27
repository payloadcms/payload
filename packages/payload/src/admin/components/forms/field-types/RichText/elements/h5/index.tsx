import React from 'react';
import ElementButton from '../Button.js';
import H5Icon from '../../../../../icons/headings/H5.js';

const H5 = ({ attributes, children }) => (
  <h5 {...attributes}>{children}</h5>
);

const h5 = {
  Button: () => (
    <ElementButton format="h5">
      <H5Icon />
    </ElementButton>
  ),
  Element: H5,
};

export default h5;
