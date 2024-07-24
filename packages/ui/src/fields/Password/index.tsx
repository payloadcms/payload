'use client'
import type { ClientValidate, Description, Validate } from 'payload'

import React, { useCallback } from 'react'

import type { FormFieldBase } from '../shared/index.js'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export type PasswordFieldProps = {
  autoComplete?: string
  className?: string
  description?: Description
  disabled?: boolean
  name: string
  path?: string
  required?: boolean
  style?: React.CSSProperties
  validate?: Validate
  width?: string
} & FormFieldBase

const _PasswordField: React.FC<PasswordFieldProps> = (props) => {
  const {
    name,
    CustomError,
    CustomLabel,
    autoComplete,
    className,
    disabled: disabledFromProps,
    errorProps,
    label,
    labelProps,
    path: pathFromProps,
    required,
    style,
    validate,
    width,
  } = props

  const memoizedValidate: ClientValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { formInitializing, formProcessing, path, setValue, showError, value } = useField({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  const disabled = disabledFromProps || formInitializing || formProcessing

  return (
    <div
      className={[
        fieldBaseClass,
        'password',
        className,
        showError && 'error',
        disabled && 'read-only',
      ]
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
        <input
          autoComplete={autoComplete}
          disabled={disabled}
          id={`field-${path.replace(/\./g, '__')}`}
          name={path}
          onChange={setValue}
          type="password"
          value={(value as string) || ''}
        />
      </div>
    </div>
  )
}

export const PasswordField = withCondition(_PasswordField)
