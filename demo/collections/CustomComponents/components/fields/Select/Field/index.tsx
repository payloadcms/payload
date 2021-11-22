import React, { useState } from 'react';
import SelectInput from '../../../../../../../src/admin/components/forms/field-types/Select';
import { Props as SelectFieldType } from '../../../../../../../src/admin/components/forms/field-types/Select/types';

const Select: React.FC<SelectFieldType> = (props) => {
  const {
    path,
    name,
    label,
    options
  } = props;

  const [internalValue, setInternalValue] = useState('');

  return (
    <SelectInput
      path={path}
      name={name}
      label={label}
      options={options}
      value={internalValue}
      onChange={setInternalValue}
    />
  )
};

export default Select;
