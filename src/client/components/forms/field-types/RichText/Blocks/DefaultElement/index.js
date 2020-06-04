import React from 'react';

const DefaultElement = (props) => {
  const { attributes, children } = props;

  return <p {...attributes}>{children}</p>;
};

export default DefaultElement;
