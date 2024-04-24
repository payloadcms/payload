'use client'
import type { Description, Validate } from 'payload/types'

import { FieldError } from '@payloadcms/ui/forms/FieldError'
import { FieldLabel } from '@payloadcms/ui/forms/FieldLabel'
import React from 'react'

import type { FormFieldBase } from '../shared/index.js'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export type PasswordFieldProps = FormFieldBase & {
  autoComplete?: string
  className?: string
  description?: Description
  disabled?: boolean
  label?: string
  name: string
  path?: string
  required?: boolean
  style?: React.CSSProperties
  validate?: Validate
  width?: string
}

const PasswordField: React.FC<PasswordFieldProps> = (props) => {
  const {
    name,
    CustomError,
    CustomLabel,
    autoComplete,
    className,
    disabled,
    errorProps,
    label,
    labelProps,
    path: pathFromProps,
    required,
    style,
    validate,
    width,
  } = props

  const { formProcessing, path, setValue, showError, value } = useField({
    path: pathFromProps || name,
    validate,
  })

  return (
    <div
      className={[fieldBaseClass, 'password', className, showError && 'error']
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <FieldError CustomError={CustomError} path={path} {...(errorProps || {})} />
      <FieldLabel
        CustomLabel={CustomLabel}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
      <input
        autoComplete={autoComplete}
        disabled={formProcessing || disabled}
        id={`field-${path.replace(/\./g, '__')}`}
        name={path}
        onChange={setValue}
        type="password"
        value={(value as string) || ''}
      />
    </div>
  )
}

export const Password = withCondition(PasswordField)
