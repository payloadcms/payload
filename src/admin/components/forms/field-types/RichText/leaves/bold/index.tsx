import React from 'react';
import LeafButton from '../Button';
import BoldIcon from '../../../../../icons/Bold';

const Bold = ({ attributes, children }) => (
  <strong {...attributes}>{children}</strong>
);

const bold = {
  Button: () => (
    <LeafButton format="bold">
      <BoldIcon />
    </LeafButton>
  ),
  Leaf: Bold,
};

export default bold;
