import React from 'react';

const Blockquote = (props) => {
  const { attributes, children } = props;

  return (
    <blockquote {...attributes}>{children}</blockquote>
  );
};

export default Blockquote;
