import React from 'react';

import './index.scss';

const CodeCell = ({ data }) => {
  const textToShow = data.length > 100 ? `${data.substring(0, 100)}\u2026` : data;

  return (
    <code className="code-cell">
      <span>{textToShow}</span>
    </code>
  );
};

export default CodeCell;
