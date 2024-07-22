'use client'
import type { ClientValidate, EmailField as EmailFieldType } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import type { FormFieldBase } from '../shared/index.js'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export type EmailFieldProps = {
  autoComplete?: string
  name?: string
  path?: string
  placeholder?: EmailFieldType['admin']['placeholder']
  width?: string
} & FormFieldBase

const _EmailField: React.FC<EmailFieldProps> = (props) => {
  const {
    name,
    AfterInput,
    BeforeInput,
    CustomDescription,
    CustomError,
    CustomLabel,
    autoComplete,
    className,
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

  const memoizedValidate: ClientValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()

  const { formInitializing, formProcessing, path, setValue, showError, value } = useField({
    path: pathFromContext ?? pathFromProps ?? name,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || readOnlyFromContext || formProcessing || formInitializing

  return (
    <div
      className={[fieldBaseClass, 'email', className, showError && 'error', disabled && 'read-only']
        .filter(Boolean)
        .join(' ')}
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
        <input
          autoComplete={autoComplete}
          disabled={disabled}
          id={`field-${path.replace(/\./g, '__')}`}
          name={path}
          onChange={setValue}
          placeholder={getTranslation(placeholder, i18n)}
          type="email"
          value={(value as string) || ''}
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

export const EmailField = withCondition(_EmailField)
