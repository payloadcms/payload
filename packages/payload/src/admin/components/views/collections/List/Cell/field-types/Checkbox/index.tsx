import React from 'react';

import './index.scss';

// Handles boolean values
const Checkbox = ({ data }) => (
  <code className="bool-cell">
    <span>{JSON.stringify(data)}</span>
  </code>
);
export default Checkbox;
