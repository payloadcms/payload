import React from 'react';
import LeafButton from '../Button';
import UnderlineIcon from '../../../../../icons/Underline';

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
