import React from 'react';

import './index.scss';

const CodeCell = ({ data }) => {
  let textToShow = '';

  if (data) textToShow = data.length > 100 ? `${data.substr(0, 100)}\u2026` : data;

  return (
    <code className="code-cell">
      <span>{textToShow}</span>
    </code>
  );
};

export default CodeCell;
