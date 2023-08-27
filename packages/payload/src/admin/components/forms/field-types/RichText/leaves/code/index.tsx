import React from 'react';
import LeafButton from '../Button.js';
import CodeIcon from '../../../../../icons/Code.js';

const Code = ({ attributes, children }) => (
  <code {...attributes}>{children}</code>
);

const code = {
  Button: () => (
    <LeafButton format="code">
      <CodeIcon />
    </LeafButton>
  ),
  Leaf: Code,
};

export default code;
