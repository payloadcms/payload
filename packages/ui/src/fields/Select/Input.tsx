'use client'
import type { OptionGroup, OptionObject } from 'payload'

import { getTranslation, I18nClient } from '@payloadcms/translations'
import React from 'react'

import type { ReactSelectAdapterProps } from '../../elements/ReactSelect/types.js'
import type { SelectFieldProps } from './index.js'

import { ReactSelect } from '../../elements/ReactSelect/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

type ExtractOptionObjectArgs = {
  options: SelectInputProps['options']
  value: string
}
function extractOptionObject({ options, value }: ExtractOptionObjectArgs) {
  return options.reduce<OptionObject>((acc, option) => {
    if (acc) return acc
    if ('value' in option && option.value === value) {
      acc = option
    } else if ('options' in option) {
      return option.options.find((groupOption) => {
        acc = groupOption
      })
    }
    return acc
  }, undefined)
}

type GenerateOptionsArgs = {
  options: SelectInputProps['options']
  i18n: I18nClient
}
function generateOptions({ options, i18n }: GenerateOptionsArgs) {
  return options.map((option: OptionObject | OptionGroup) => {
    if ('options' in option) {
      return {
        label: getTranslation(option.label, i18n),
        options: generateOptions({ options: option.options, i18n }),
      }
    }

    return {
      label: getTranslation(option.label, i18n),
      value: option.value,
    }
  })
}

export type SelectInputProps = {
  onChange?: ReactSelectAdapterProps['onChange']
  options?: (OptionObject | OptionGroup)[]
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
    AfterInput,
    BeforeInput,
    CustomDescription,
    CustomError,
    CustomLabel,
    className,
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
      const matchingOption = extractOptionObject({ options, value: val })

      return {
        label: matchingOption ? getTranslation(matchingOption.label, i18n) : val,
        value: matchingOption?.value ?? val,
      }
    })
  } else if (typeof value === 'string') {
    const matchingOption = extractOptionObject({ options, value })

    valueToRender = {
      label: matchingOption ? getTranslation(matchingOption.label, i18n) : value,
      value: matchingOption?.value ?? value,
    }
  }

  console.log({ valueToRender })
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
      <FieldLabel
        CustomLabel={CustomLabel}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError CustomError={CustomError} path={path} {...(errorProps || {})} />
        {BeforeInput}
        <ReactSelect
          disabled={readOnly}
          isClearable={isClearable}
          isMulti={hasMany}
          isSortable={isSortable}
          onChange={onChange}
          options={generateOptions({ options, i18n })}
          showError={showError}
          value={valueToRender as OptionObject}
        />
        {AfterInput}
      </div>
      {CustomDescription !== undefined ? (
        CustomDescription
      ) : (
        <FieldDescription {...(descriptionProps || {})} />
      )}
    </div>
  )
}
