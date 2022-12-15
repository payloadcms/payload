import React from 'react';

import './index.scss';

const JSONCell = ({ data }) => {
  const textToShow = data.length > 100 ? `${data.substring(0, 100)}\u2026` : data;

  return (
    <code className="json-cell">
      <span>
        {JSON.stringify(textToShow)}
      </span>
    </code>
  );
};

export default JSONCell;
