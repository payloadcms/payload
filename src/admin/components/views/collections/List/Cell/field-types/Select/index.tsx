import React from 'react';
import { OptionObject, optionsAreObjects, SelectField } from '../../../../../../../../fields/config/types';

const SelectCell = ({ data, field }: { data: any, field: SelectField }) => {
  const findLabel = (items: string[]) => items.map((i) => {
    const found = (field.options as OptionObject[])
      .filter((f: OptionObject) => f.value === i)?.[0]?.label;
    return found;
  }).join(', ');

  let content = '';
  if (optionsAreObjects(field.options)) {
    content = Array.isArray(data)
      ? findLabel(data) // hasMany
      : findLabel([data]);
  } else {
    content = Array.isArray(data)
      ? data.join(', ') // hasMany
      : data;
  }
  return (
    <span>
      {content}
    </span>
  );
};

export default SelectCell;
