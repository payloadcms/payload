import React from 'react';
import ElementButton from '../Button';
import H1Icon from '../../../../../icons/headings/H1';

const H1 = ({ attributes, children }) => (
  <h1 {...attributes}>{children}</h1>
);

const h1 = {
  Button: () => (
    <ElementButton
      format="h1"
    >
      <H1Icon />
    </ElementButton>
  ),
  Element: H1,
};

export default h1;
