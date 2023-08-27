import React from 'react';
import LeafButton from '../Button.js';
import UnderlineIcon from '../../../../../icons/Underline/index.js';

const Underline = ({ attributes, children }) => (
  <u {...attributes}>{children}</u>
);

const underline = {
  Button: () => (
    <LeafButton format="underline">
      <UnderlineIcon />
    </LeafButton>
  ),
  Leaf: Underline,
};

export default underline;
