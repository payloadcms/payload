'use client'
import type { KeyboardEventHandler } from 'react'

import { arrayMove } from '@dnd-kit/sortable'
import { getTranslation } from '@payloadcms/translations'
import React, { useEffect, useId } from 'react'
import Select, { type StylesConfig } from 'react-select'
import CreatableSelect from 'react-select/creatable'

import type { Option, ReactSelectAdapterProps } from './types.js'
export type { Option } from './types.js'

import { useTranslation } from '../../providers/Translation/index.js'
import { DraggableSortable } from '../DraggableSortable/index.js'
import { ShimmerEffect } from '../ShimmerEffect/index.js'
import { ClearIndicator } from './ClearIndicator/index.js'
import { Control } from './Control/index.js'
import { DropdownIndicator } from './DropdownIndicator/index.js'
import './index.scss'
import { Input } from './Input/index.js'
import { generateMultiValueDraggableID, MultiValue } from './MultiValue/index.js'
import { MultiValueLabel } from './MultiValueLabel/index.js'
import { MultiValueRemove } from './MultiValueRemove/index.js'
import { SingleValue } from './SingleValue/index.js'
import { ValueContainer } from './ValueContainer/index.js'

const createOption = (label: string) => ({
  label,
  value: label,
})

const SelectAdapter: React.FC<ReactSelectAdapterProps> = (props) => {
  const { i18n, t } = useTranslation()
  const [inputValue, setInputValue] = React.useState('') // for creatable select
  const uuid = useId()
  const [hasMounted, setHasMounted] = React.useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const {
    className,
    components,
    customProps,
    disabled = false,
    filterOption = undefined,
    getOptionValue,
    isClearable = true,
    isCreatable,
    isLoading,
    isSearchable = true,
    noOptionsMessage = () => t('general:noOptions'),
    numberOnly = false,
    onChange,
    onMenuClose,
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

  const styles: StylesConfig<Option> = {
    // Remove the default react-select z-index from the menu so that our custom
    // z-index in the "payload-default" css layer can take effect, in such a way
    // that end users can easily override it as with other styles.
    menu: (rsStyles) => ({ ...rsStyles, zIndex: undefined }),
  }

  if (!hasMounted) {
    return <ShimmerEffect height="calc(var(--base) * 2 + 2px)" />
  }

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
          DropdownIndicator,
          Input,
          MultiValue,
          MultiValueLabel,
          MultiValueRemove,
          SingleValue,
          ValueContainer,
          ...components,
        }}
        filterOption={filterOption}
        getOptionValue={getOptionValue}
        instanceId={uuid}
        isClearable={isClearable}
        isDisabled={disabled}
        isSearchable={isSearchable}
        loadingMessage={loadingMessage}
        menuPlacement="auto"
        noOptionsMessage={noOptionsMessage}
        onChange={onChange}
        onMenuClose={onMenuClose}
        onMenuOpen={onMenuOpen}
        options={options}
        styles={styles}
        unstyled={true}
        value={value}
      />
    )
  }
  const handleKeyDown: KeyboardEventHandler = (event) => {
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
    if (!value || !inputValue || inputValue.trim() === '') {
      return
    }
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
        DropdownIndicator,
        Input,
        MultiValue,
        MultiValueLabel,
        MultiValueRemove,
        SingleValue,
        ValueContainer,
        ...components,
      }}
      filterOption={filterOption}
      inputValue={inputValue}
      instanceId={uuid}
      isClearable={isClearable}
      isDisabled={disabled}
      isSearchable={isSearchable}
      loadingMessage={loadingMessage}
      menuPlacement="auto"
      noOptionsMessage={noOptionsMessage}
      onChange={onChange}
      onInputChange={(newValue) => setInputValue(newValue)}
      onKeyDown={handleKeyDown}
      onMenuClose={onMenuClose}
      onMenuOpen={onMenuOpen}
      options={options}
      styles={styles}
      unstyled={true}
      value={value}
    />
  )
}

const SortableSelect: React.FC<ReactSelectAdapterProps> = (props) => {
  const { getOptionValue, onChange, value } = props

  let draggableIDs: string[] = []
  if (value) {
    draggableIDs = (Array.isArray(value) ? value : [value]).map((optionValue) => {
      return generateMultiValueDraggableID(optionValue, getOptionValue)
    })
  }

  return (
    <DraggableSortable
      className="react-select-container"
      ids={draggableIDs}
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

export const ReactSelect: React.FC<ReactSelectAdapterProps> = (props) => {
  const { isMulti, isSortable } = props

  if (isMulti && isSortable) {
    return <SortableSelect {...props} />
  }

  return <SelectAdapter {...props} />
}
