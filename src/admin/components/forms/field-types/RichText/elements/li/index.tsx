import React from 'react';

const LI = ({ attributes, children }) => (
  <li {...attributes}>{children}</li>
);

export default {
  Element: LI,
};
