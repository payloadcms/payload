import React from 'react';

const RichTextCell = ({ data }) => {
  const flattenedText = data?.map((i) => i?.children?.map((c) => c.text)).join(' ');
  const textToShow = flattenedText?.length > 100 ? `${flattenedText.slice(0, 100)}\u2026` : flattenedText;
  return (
    <span>{textToShow}</span>
  );
};

export default RichTextCell;
