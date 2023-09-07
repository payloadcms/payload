import React from 'react'
import { useTranslation } from 'react-i18next'

import type { OptionObject, SelectField } from '../../../../../fields/config/types'
import type { Option } from '../../../elements/ReactSelect/types'
import type { Description } from '../../FieldDescription/types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import ReactSelect from '../../../elements/ReactSelect'
import Error from '../../Error'
import FieldDescription from '../../FieldDescription'
import Label from '../../Label'
import './index.scss'

export type SelectInputProps = Omit<SelectField, 'options' | 'type' | 'value'> & {
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
    className,
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

  const classes = ['field-type', 'select', className, showError && 'error', readOnly && 'read-only']
    .filter(Boolean)
    .join(' ')

  let valueToRender

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
      className={classes}
      id={`field-${path.replace(/\./g, '__')}`}
      style={{
        ...style,
        width,
      }}
    >
      <Error message={errorMessage} showError={showError} />
      <Label htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
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
      <FieldDescription description={description} value={value} />
    </div>
  )
}

export default SelectInput
