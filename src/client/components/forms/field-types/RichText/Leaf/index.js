import React from 'react';

const Leaf = (props) => {
  const { children, attributes, leaf } = props;

  const styles = {
    fontWeight: leaf.bold ? 'bold' : 'normal',
    fontStyle: leaf.italic ? 'italic' : 'normal',
    textDecoration: leaf.underline ? 'underline' : 'none',
  };

  if (leaf.code) {
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

export default Leaf;
