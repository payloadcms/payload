import React from 'react';
import listTypes from '../listTypes';

const LI = (props) => {
  const { attributes, element, children } = props;
  const disableListStyle = element.children.length >= 1 && listTypes.includes(element.children?.[0]?.type);

  return (
    <li
      style={{ listStyle: disableListStyle ? 'none' : undefined }}
      {...attributes}
    >
      {children}
    </li>
  );
};

export default {
  Element: LI,
};
