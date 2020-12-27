import React from 'react';
import LeafButton from '../Button';
import StrikethroughIcon from '../../../../../icons/Strikethrough';

const Strikethrough = ({ attributes, children }) => (
  <del {...attributes}>
    {children}
  </del>
);

const strikethrough = {
  Button: () => (
    <LeafButton format="strikethrough">
      <StrikethroughIcon />
    </LeafButton>
  ),
  Leaf: Strikethrough,
};

export default strikethrough;
