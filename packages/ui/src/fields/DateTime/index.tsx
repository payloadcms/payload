/* eslint-disable react/destructuring-assignment */
'use client'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { DatePickerField } from '../../elements/DatePicker/index.js'
import { FieldLabel } from '../../forms/FieldLabel/index.js'
import { useField } from '../../forms/useField/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const baseClass = 'date-time-field'

import type { DateField, FieldBase } from 'payload/types'

import { FieldDescription } from '@payloadcms/ui/forms/FieldDescription'
import { FieldError } from '@payloadcms/ui/forms/FieldError'
import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'

import type { FormFieldBase } from '../shared/index.js'

import { withCondition } from '../../forms/withCondition/index.js'

export type DateFieldProps = FormFieldBase & {
  date?: DateField['admin']['date']
  label?: FieldBase['label']
  name?: string
  path?: string
  placeholder?: DateField['admin']['placeholder'] | string
  width?: string
}

const DateTimeField: React.FC<DateFieldProps> = (props) => {
  const {
    name,
    AfterInput,
    BeforeInput,
    CustomDescription,
    CustomError,
    CustomLabel,
    className,
    date: datePickerProps,
    descriptionProps,
    errorProps,
    label,
    labelProps,
    path: pathFromProps,
    placeholder,
    readOnly: readOnlyFromProps,
    required,
    style,
    validate,
    width,
  } = props

  const { i18n } = useTranslation()

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const { path, setValue, showError, value } = useField<Date>({
    path: pathFromContext || pathFromProps || name,
    validate,
  })

  const readOnly = readOnlyFromProps || readOnlyFromContext

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && `${baseClass}--has-error`,
        readOnly && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__error-wrap`}>
        <FieldError CustomError={CustomError} path={path} {...(errorProps || {})} />
      </div>
      <FieldLabel
        CustomLabel={CustomLabel}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
      <div className={`${baseClass}__input-wrapper`} id={`field-${path.replace(/\./g, '__')}`}>
        {BeforeInput}
        <DatePickerField
          {...datePickerProps}
          onChange={(incomingDate) => {
            if (!readOnly) setValue(incomingDate?.toISOString() || null)
          }}
          placeholder={getTranslation(placeholder, i18n)}
          readOnly={readOnly}
          value={value}
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

export const DateTime = withCondition(DateTimeField)
