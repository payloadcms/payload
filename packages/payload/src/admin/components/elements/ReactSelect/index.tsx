import type { KeyboardEventHandler } from 'react'

import { arrayMove } from '@dnd-kit/sortable'
import React from 'react'
import { useTranslation } from 'react-i18next'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'

import type { Option } from './types.js'
import type { Props as ReactSelectAdapterProps } from './types.js'

import { getTranslation } from '../../../../utilities/getTranslation.js'
import Chevron from '../../icons/Chevron/index.js'
import DraggableSortable from '../DraggableSortable/index.js'
import { ClearIndicator } from './ClearIndicator/index.js'
import { Control } from './Control/index.js'
import { MultiValue } from './MultiValue/index.js'
import { MultiValueLabel } from './MultiValueLabel/index.js'
import { MultiValueRemove } from './MultiValueRemove/index.js'
import { SingleValue } from './SingleValue/index.js'
import { ValueContainer } from './ValueContainer/index.js'
import './index.scss'

const createOption = (label: string) => ({
  label,
  value: label,
})

const SelectAdapter: React.FC<ReactSelectAdapterProps> = (props) => {
  const { i18n, t } = useTranslation()
  const [inputValue, setInputValue] = React.useState('') // for creatable select

  const {
    className,
    components,
    disabled = false,
    filterOption = undefined,
    isClearable = true,
    isCreatable,
    isLoading,
    isSearchable = true,
    noOptionsMessage,
    numberOnly = false,
    onChange,
    onMenuOpen,
    options,
    placeholder = t('general:selectValue'),
    selectProps,
    showError,
    value,
  } = props

  const classes = [className, 'react-select', showError && 'react-select--error']
    .filter(Boolean)
    .join(' ')

  if (!isCreatable) {
    return (
      <Select
        captureMenuScroll
        customProps={selectProps}
        isLoading={isLoading}
        placeholder={getTranslation(placeholder, i18n)}
        {...props}
        components={{
          ClearIndicator,
          Control,
          DropdownIndicator: Chevron,
          MultiValue,
          MultiValueLabel,
          MultiValueRemove,
          SingleValue,
          ValueContainer,
          ...components,
        }}
        className={classes}
        classNamePrefix="rs"
        filterOption={filterOption}
        isClearable={isClearable}
        isDisabled={disabled}
        isSearchable={isSearchable}
        menuPlacement="auto"
        noOptionsMessage={noOptionsMessage}
        onChange={onChange}
        onMenuOpen={onMenuOpen}
        options={options}
        value={value}
      />
    )
  }
  const handleKeyDown: KeyboardEventHandler = (event) => {
    // eslint-disable-next-line no-restricted-globals
    if (numberOnly === true) {
      const acceptableKeys = [
        'Tab',
        'Escape',
        'Backspace',
        'Enter',
        'ArrowRight',
        'ArrowLeft',
        'ArrowUp',
        'ArrowDown',
      ]
      const isNumber = !/\D/.test(event.key)
      const isActionKey = acceptableKeys.includes(event.key)
      if (!isNumber && !isActionKey) {
        event.preventDefault()
        return
      }
    }
    if (!value || !inputValue || inputValue.trim() === '') return
    if (filterOption && !filterOption(null, inputValue)) {
      return
    }
    switch (event.key) {
      case 'Enter':
      case 'Tab':
        onChange([...(value as Option[]), createOption(inputValue)])
        setInputValue('')
        event.preventDefault()
        break
      default:
        break
    }
  }

  return (
    <CreatableSelect
      captureMenuScroll
      isLoading={isLoading}
      placeholder={getTranslation(placeholder, i18n)}
      {...props}
      components={{
        ClearIndicator,
        Control,
        DropdownIndicator: Chevron,
        MultiValue,
        MultiValueLabel,
        MultiValueRemove,
        SingleValue,
        ValueContainer,
        ...components,
      }}
      className={classes}
      classNamePrefix="rs"
      filterOption={filterOption}
      inputValue={inputValue}
      isClearable={isClearable}
      isDisabled={disabled}
      isSearchable={isSearchable}
      menuPlacement="auto"
      noOptionsMessage={noOptionsMessage}
      onChange={onChange}
      onInputChange={(newValue) => setInputValue(newValue)}
      onKeyDown={handleKeyDown}
      onMenuOpen={onMenuOpen}
      options={options}
      value={value}
    />
  )
}

const SortableSelect: React.FC<ReactSelectAdapterProps> = (props) => {
  const { onChange, value } = props

  let ids: string[] = []
  if (value)
    ids = Array.isArray(value)
      ? value.map((item) => item?.id ?? `${item?.value}`)
      : [value?.id || `${value?.value}`]

  return (
    <DraggableSortable
      onDragEnd={({ moveFromIndex, moveToIndex }) => {
        let sorted = value
        if (value && Array.isArray(value)) {
          sorted = arrayMove(value, moveFromIndex, moveToIndex)
        }
        onChange(sorted)
      }}
      className="react-select-container"
      ids={ids}
    >
      <SelectAdapter {...props} />
    </DraggableSortable>
  )
}

const ReactSelect: React.FC<ReactSelectAdapterProps> = (props) => {
  const { isMulti, isSortable } = props

  if (isMulti && isSortable) {
    return <SortableSelect {...props} />
  }

  return <SelectAdapter {...props} />
}

export default ReactSelect
