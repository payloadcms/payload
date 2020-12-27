import React from 'react';
import LeafButton from '../Button';
import ItalicIcon from '../../../../../icons/Italic';

const Italic = ({ attributes, children }) => (
  <em {...attributes}>{children}</em>
);

const italic = {
  Button: () => (
    <LeafButton format="italic">
      <ItalicIcon />
    </LeafButton>
  ),
  Leaf: Italic,
};

export default italic;
