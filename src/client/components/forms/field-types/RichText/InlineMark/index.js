import React from 'react';

const InlineMark = (props) => {
  const { children, attributes, leaf: marks } = props;

  return (
    <span
      {...attributes}
      style={{
        fontWeight: marks.bold ? 'bold' : 'normal',
        fontStyle: marks.italic ? 'italic' : 'normal',
        textDecoration: marks.underline ? 'underline' : 'none',
      }}
    >
      {children}
    </span>
  );
};

export default InlineMark;
