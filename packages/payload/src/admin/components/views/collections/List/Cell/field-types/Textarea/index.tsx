import React from 'react';

const TextareaCell = ({ data }) => {
  const textToShow = data?.length > 100 ? `${data.substr(0, 100)}\u2026` : data;
  return (
    <span>{textToShow}</span>
  );
};

export default TextareaCell;
