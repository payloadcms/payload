import React from 'react';
import ElementButton from '../Button';
import OLIcon from '../../../../../icons/OrderedList';

const OL = ({ attributes, children }) => (
  <ol {...attributes}>{children}</ol>
);

const ol = {
  Button: () => (
    <ElementButton format="ol">
      <OLIcon />
    </ElementButton>
  ),
  Element: OL,
};

export default ol;
