import React from 'react'
import { useTranslation } from 'react-i18next'

import type { OptionObject, SelectField } from '../../../../../fields/config/types'
import type { Option } from '../../../elements/ReactSelect/types'
import type { Description } from '../../FieldDescription/types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import ReactSelect from '../../../elements/ReactSelect'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import { fieldBaseClass } from '../shared'
import './index.scss'

export type SelectInputProps = Omit<SelectField, 'options' | 'type' | 'value'> & {
  Error?: React.ComponentType<any>
  Label?: React.ComponentType<any>
  className?: string
  description?: Description
  errorMessage?: string
  hasMany?: boolean
  isClearable?: boolean
  isSortable?: boolean
  onChange?: (value: Option) => void
  options?: OptionObject[]
  path: string
  readOnly?: boolean
  required?: boolean
  showError?: boolean
  style?: React.CSSProperties
  value?: string | string[]
  width?: string
}

const SelectInput: React.FC<SelectInputProps> = (props) => {
  const {
    Error,
    Label,
    className,
    defaultValue,
    description,
    errorMessage,
    hasMany,
    isClearable,
    isSortable,
    label,
    onChange,
    options,
    path,
    readOnly,
    required,
    showError,
    style,
    value,
    width,
  } = props

  const { i18n } = useTranslation()

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  let valueToRender = defaultValue

  if (hasMany && Array.isArray(value)) {
    valueToRender = value.map((val) => {
      const matchingOption = options.find((option) => option.value === val)
      return {
        label: matchingOption ? getTranslation(matchingOption.label, i18n) : val,
        value: matchingOption?.value ?? val,
      }
    })
  } else if (value) {
    const matchingOption = options.find((option) => option.value === value)
    valueToRender = {
      label: matchingOption ? getTranslation(matchingOption.label, i18n) : value,
      value: matchingOption?.value ?? value,
    }
  }

  return (
    <div
      className={[
        fieldBaseClass,
        'select',
        className,
        showError && 'error',
        readOnly && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path.replace(/\./g, '__')}`}
      style={{
        ...style,
        width,
      }}
    >
      <ErrorComp message={errorMessage} showError={showError} />
      <LabelComp htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
      <ReactSelect
        disabled={readOnly}
        isClearable={isClearable}
        isMulti={hasMany}
        isSortable={isSortable}
        onChange={onChange}
        options={options.map((option) => ({
          ...option,
          label: getTranslation(option.label, i18n),
        }))}
        showError={showError}
        value={valueToRender as Option}
      />
      <FieldDescription description={description} path={path} value={value} />
    </div>
  )
}

export default SelectInput
