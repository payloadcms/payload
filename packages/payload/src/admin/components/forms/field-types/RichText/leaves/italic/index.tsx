import React from 'react';
import LeafButton from '../Button.js';
import ItalicIcon from '../../../../../icons/Italic.js';

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
