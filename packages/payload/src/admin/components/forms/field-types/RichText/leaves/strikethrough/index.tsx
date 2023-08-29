import React from 'react';
import LeafButton from '../Button.js';
import StrikethroughIcon from '../../../../../icons/Strikethrough/index.js';

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
