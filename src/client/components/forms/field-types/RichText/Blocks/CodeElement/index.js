import React from 'react';

const CodeElement = (props) => {
  const { attributes, children } = props;

  return (
    <pre {...attributes}>
      <code>{children}</code>
    </pre>
  );
};

export default CodeElement;
