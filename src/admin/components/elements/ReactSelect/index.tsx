import React, { KeyboardEventHandler } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { useTranslation } from 'react-i18next';
import { arrayMove } from '@dnd-kit/sortable';
import { Props as ReactSelectAdapterProps } from './types';
import Chevron from '../../icons/Chevron';
import { getTranslation } from '../../../../utilities/getTranslation';
import { SingleValue } from './SingleValue';
import { MultiValueLabel } from './MultiValueLabel';
import { MultiValue } from './MultiValue';
import { ValueContainer } from './ValueContainer';
import { ClearIndicator } from './ClearIndicator';
import { MultiValueRemove } from './MultiValueRemove';
import { Control } from './Control';
import DraggableSortable from '../DraggableSortable';
import type { Option } from './types';

import './index.scss';


const createOption = (label: string) => ({
  label,
  value: label,
});


const SelectAdapter: React.FC<ReactSelectAdapterProps> = (props) => {
  const { t, i18n } = useTranslation();
  const [inputValue, setInputValue] = React.useState(''); // for creatable select

  const {
    className,
    showError,
    options,
    onChange,
    value,
    disabled = false,
    placeholder = t('general:selectValue'),
    isSearchable = true,
    isClearable = true,
    filterOption = undefined,
    numberOnly = false,
    isLoading,
    onMenuOpen,
    components,
    isCreatable,
    selectProps,
  } = props;

  const classes = [
    className,
    'react-select',
    showError && 'react-select--error',
  ].filter(Boolean).join(' ');

  if (!isCreatable) {
    return (
      <Select
        isLoading={isLoading}
        placeholder={getTranslation(placeholder, i18n)}
        captureMenuScroll
        {...props}
        value={value}
        onChange={onChange}
        isDisabled={disabled}
        className={classes}
        classNamePrefix="rs"
        options={options}
        isSearchable={isSearchable}
        isClearable={isClearable}
        filterOption={filterOption}
        onMenuOpen={onMenuOpen}
        menuPlacement="auto"
        components={{
          ValueContainer,
          SingleValue,
          MultiValue,
          MultiValueLabel,
          MultiValueRemove,
          DropdownIndicator: Chevron,
          ClearIndicator,
          Control,
          ...components,
        }}
      />
    );
  }
  const handleKeyDown: KeyboardEventHandler = (event) => {
    // eslint-disable-next-line no-restricted-globals
    if (numberOnly === true) {
      const acceptableKeys = ['Tab', 'Escape', 'Backspace', 'Enter', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'];
      const isNumber = !/[^0-9]/.test(event.key);
      const isActionKey = acceptableKeys.includes(event.key);
      if (!isNumber && !isActionKey) {
        event.preventDefault();
        return;
      }
    }
    if (!value || !inputValue || inputValue.trim() === '') return;
    if (filterOption && !filterOption(null, inputValue)) {
      return;
    }
    switch (event.key) {
      case 'Enter':
      case 'Tab':
        onChange([...value as Option[], createOption(inputValue)]);
        setInputValue('');
        event.preventDefault();
        break;
      default:
        break;
    }
  };


  return (
    <CreatableSelect
      isLoading={isLoading}
      placeholder={getTranslation(placeholder, i18n)}
      captureMenuScroll
      {...props}
      customProps={selectProps}
      value={value}
      onChange={onChange}
      isDisabled={disabled}
      className={classes}
      classNamePrefix="rs"
      options={options}
      isSearchable={isSearchable}
      isClearable={isClearable}
      filterOption={filterOption}
      onMenuOpen={onMenuOpen}
      menuPlacement="auto"
      inputValue={inputValue}
      onInputChange={(newValue) => setInputValue(newValue)}
      onKeyDown={handleKeyDown}
      components={{
        ValueContainer,
        SingleValue,
        MultiValue,
        MultiValueLabel,
        MultiValueRemove,
        DropdownIndicator: Chevron,
        ClearIndicator,
        Control,
        ...components,
      }}
    />
  );
};

const SortableSelect: React.FC<ReactSelectAdapterProps> = (props) => {
  const {
    onChange,
    value,
  } = props;


  let ids: string[] = [];
  if (value) ids = Array.isArray(value) ? value.map((item) => item?.id ?? `${item?.value}` as string) : [value?.id || `${value?.value}` as string];


  return (
    <DraggableSortable
      ids={ids}
      className="react-select-container"
      onDragEnd={({ moveFromIndex, moveToIndex }) => {
        let sorted = value;
        if (value && Array.isArray(value)) {
          sorted = arrayMove(value, moveFromIndex, moveToIndex);
        }
        onChange(sorted);
      }}
    >
      <SelectAdapter {...props} />
    </DraggableSortable>
  );
};

const ReactSelect: React.FC<ReactSelectAdapterProps> = (props) => {
  const {
    isMulti,
    isSortable,
  } = props;

  if (isMulti && isSortable) {
    return (
      <SortableSelect {...props} />
    );
  }

  return (
    <SelectAdapter {...props} />
  );
};

export default ReactSelect;
