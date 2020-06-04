import React from 'react';

const InlineMark = (props) => {
  const { children, attributes, leaf: marks } = props;

  const styles = {
    fontWeight: marks.bold ? 'bold' : 'normal',
    fontStyle: marks.italic ? 'italic' : 'normal',
    textDecoration: marks.underline ? 'underline' : 'none',
  };

  if (marks.code) {
    return (
      <code {...attributes}>
        <span style={styles}>
          { children }
        </span>
      </code>
    );
  }

  return (
    <span
      {...attributes}
      style={styles}
    >
      { children }
    </span>
  );
};

export default InlineMark;
