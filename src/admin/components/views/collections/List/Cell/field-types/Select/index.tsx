import React from 'react';

const SelectCell = ({ data, field }) => {
  const findLabel = (items) => items.map((i) => {
    const found = field.options.filter((f) => f.value === i)?.[0]?.label;
    return found;
  }).join(', ');

  let content = '';
  if (field?.options?.[0]?.value) {
    content = (Array.isArray(data))
      ? findLabel(data) // hasMany
      : findLabel([data]);
  } else {
    content = data.join(', ');
  }
  return (
    <span>
      {content}
    </span>
  );
};

export default SelectCell;
