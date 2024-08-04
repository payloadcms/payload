'use client'
import type { OptionObject, SelectFieldProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { ReactSelectAdapterProps } from '../../elements/ReactSelect/types.js'

import { ReactSelect } from '../../elements/ReactSelect/index.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export type SelectInputProps = {
  onChange?: ReactSelectAdapterProps['onChange']
  options?: OptionObject[]
  showError?: boolean
  value?: string | string[]
} & Omit<
  SelectFieldProps,
  | 'custom'
  | 'disabled'
  | 'docPreferences'
  | 'locale'
  | 'localized'
  | 'onChange'
  | 'options'
  | 'rtl'
  | 'type'
  | 'user'
  | 'validate'
  | 'value'
>

export const SelectInput: React.FC<SelectInputProps> = (props) => {
  const {
    Description,
    Error,
    Label,
    afterInput,
    beforeInput,
    className,
    description,
    descriptionProps,
    errorProps,
    hasMany = false,
    isClearable = true,
    isSortable = true,
    label,
    labelProps,
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
      <FieldLabel CustomLabel={Label} label={label} required={required} {...(labelProps || {})} />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError Error={Error} path={path} {...(errorProps || {})} />
        <RenderComponent mappedComponent={beforeInput} />
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
          value={valueToRender as OptionObject}
        />
        <RenderComponent mappedComponent={afterInput} />
      </div>
      <FieldDescription
        Description={Description}
        description={description}
        {...(descriptionProps || {})}
      />
    </div>
  )
}
