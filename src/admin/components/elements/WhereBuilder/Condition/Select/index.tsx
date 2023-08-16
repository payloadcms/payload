import React from 'react';

import { useTranslation } from 'react-i18next';
import { ReactSelect } from '../../../ReactSelect';
import { getTranslation } from '../../../../../../utilities/getTranslation';
import { Props } from './types';
import { Option, OptionObject } from '../../../../../../fields/config/types';

const formatOptions = (options: Option[]): OptionObject[] => options.map((option) => {
  if (typeof option === 'object' && (option.value || option.value === '')) {
    return option;
  }

  return {
    label: option,
    value: option,
  } as OptionObject;
});

export const Select: React.FC<Props> = ({ onChange, value, options: optionsFromProps, operator }) => {
  const { i18n } = useTranslation();
  const [options, setOptions] = React.useState(formatOptions(optionsFromProps));

  const isMulti = ['in', 'not_in'].includes(operator);
  let valueToRender;

  if (isMulti && Array.isArray(value)) {
    valueToRender = value.map((val) => {
      const matchingOption = options.find((option) => option.value === val);
      return {
        label: matchingOption ? getTranslation(matchingOption.label, i18n) : val,
        value: matchingOption?.value ?? val,
      };
    });
  } else if (value) {
    const matchingOption = options.find((option) => option.value === value);
    valueToRender = {
      label: matchingOption ? getTranslation(matchingOption.label, i18n) : value,
      value: matchingOption?.value ?? value,
    };
  }

  const onSelect = React.useCallback((selectedOption) => {
    let newValue;
    if (!selectedOption) {
      newValue = null;
    } else if (isMulti) {
      if (Array.isArray(selectedOption)) {
        newValue = selectedOption.map((option) => option.value);
      } else {
        newValue = [];
      }
    } else {
      newValue = selectedOption.value;
    }

    onChange(newValue);
  }, [
    isMulti,
    onChange,
  ]);

  React.useEffect(() => {
    setOptions(formatOptions(optionsFromProps));
  }, [optionsFromProps]);

  React.useEffect(() => {
    if (!isMulti && Array.isArray(value)) {
      onChange(value[0]);
    }
  }, [isMulti, onChange, value]);

  return (
    <ReactSelect
      onChange={onSelect}
      value={valueToRender}
      options={options.map((option) => ({ ...option, label: getTranslation(option.label, i18n) }))}
      isMulti={isMulti}
    />
  );
};
