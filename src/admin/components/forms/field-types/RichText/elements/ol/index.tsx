import React from 'react';
import ListButton from '../ListButton';
import OLIcon from '../../../../../icons/OrderedList';

const OL = ({ attributes, children }) => (
  <ol {...attributes}>{children}</ol>
);

const ol = {
  Button: () => (
    <ListButton format="ol">
      <OLIcon />
    </ListButton>
  ),
  Element: OL,
};

export default ol;
