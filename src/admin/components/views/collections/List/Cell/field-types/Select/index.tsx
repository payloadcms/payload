import React from 'react';
import { useTranslation } from 'react-i18next';
import { OptionObject, optionsAreObjects, SelectField } from '../../../../../../../../fields/config/types';
import { getTranslation } from '../../../../../../../../utilities/getTranslation';

type Props = {
  data: any
  field: SelectField
}

const SelectCell:React.FC<Props> = ({ data, field }: Props) => {
  const { i18n } = useTranslation();
  const findLabel = (items: string[]) => items.map((i) => {
    const found = (field.options as OptionObject[])
      .filter((f: OptionObject) => f.value === i)?.[0]?.label;
    return getTranslation(found, i18n);
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
