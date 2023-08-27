import React from 'react';
import ElementButton from '../Button.js';
import BlockquoteIcon from '../../../../../icons/Blockquote.js';

import './index.scss';

const Blockquote = ({ attributes, children }) => (
  <blockquote
    className="rich-text-blockquote"
    {...attributes}
  >
    {children}
  </blockquote>
);

const blockquote = {
  Button: () => (
    <ElementButton format="blockquote">
      <BlockquoteIcon />
    </ElementButton>
  ),
  Element: Blockquote,
};

export default blockquote;
