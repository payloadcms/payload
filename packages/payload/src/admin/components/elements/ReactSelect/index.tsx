import type { KeyboardEventHandler } from 'react'

import { arrayMove } from '@dnd-kit/sortable'
import React from 'react'
import { useTranslation } from 'react-i18next'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'

import type { Option } from './types'
import type { Props as ReactSelectAdapterProps } from './types'

import { getTranslation } from '../../../../utilities/getTranslation'
import Chevron from '../../icons/Chevron'
import DraggableSortable from '../DraggableSortable'
import { ClearIndicator } from './ClearIndicator'
import { Control } from './Control'
import { MultiValue } from './MultiValue'
import { MultiValueLabel } from './MultiValueLabel'
import { MultiValueRemove } from './MultiValueRemove'
import { SingleValue } from './SingleValue'
import { ValueContainer } from './ValueContainer'
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
    customProps,
    disabled = false,
    filterOption = undefined,
    isClearable = true,
    isCreatable,
    isLoading,
    isSearchable = true,
    noOptionsMessage = () => t('general:noOptions'),
    numberOnly = false,
    onChange,
    onMenuOpen,
    options,
    placeholder = t('general:selectValue'),
    showError,
    value,
  } = props

  const loadingMessage = () => t('general:loading') + '...'

  const classes = [className, 'react-select', showError && 'react-select--error']
    .filter(Boolean)
    .join(' ')

  if (!isCreatable) {
    return (
      <Select
        captureMenuScroll
        customProps={customProps}
        isLoading={isLoading}
        placeholder={getTranslation(placeholder, i18n)}
        {...props}
        className={classes}
        classNamePrefix="rs"
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
        filterOption={filterOption}
        isClearable={isClearable}
        isDisabled={disabled}
        isSearchable={isSearchable}
        loadingMessage={loadingMessage}
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
      className={classes}
      classNamePrefix="rs"
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
      filterOption={filterOption}
      inputValue={inputValue}
      isClearable={isClearable}
      isDisabled={disabled}
      isSearchable={isSearchable}
      loadingMessage={loadingMessage}
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
      className="react-select-container"
      ids={ids}
      onDragEnd={({ moveFromIndex, moveToIndex }) => {
        let sorted = value
        if (value && Array.isArray(value)) {
          sorted = arrayMove(value, moveFromIndex, moveToIndex)
        }
        onChange(sorted)
      }}
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
