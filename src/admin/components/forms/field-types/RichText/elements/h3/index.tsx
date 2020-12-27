import React from 'react';
import ElementButton from '../Button';
import H3Icon from '../../../../../icons/headings/H3';

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
