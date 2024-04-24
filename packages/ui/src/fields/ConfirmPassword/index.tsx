'use client'
import type { Description, FormField, Validate } from 'payload/types'

import React, { useCallback } from 'react'

import type { FormFieldBase } from '../shared/index.js'

import { FieldError } from '../../forms/FieldError/index.js'
import { FieldLabel } from '../../forms/FieldLabel/index.js'
import { useFormFields } from '../../forms/Form/context.js'
import { useField } from '../../forms/useField/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'
export type ConfirmPasswordFieldProps = FormFieldBase & {
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

export const ConfirmPassword: React.FC<ConfirmPasswordFieldProps> = (props) => {
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
    width,
  } = props

  const password = useFormFields<FormField>(([fields]) => fields.password)
  const { t } = useTranslation()

  const validate = useCallback(
    (value: string) => {
      if (!value) {
        return t('validation:required')
      }

      if (value === password?.value) {
        return true
      }

      return t('fields:passwordsDoNotMatch')
    },
    [password, t],
  )

  const { formProcessing, path, setValue, showError, value } = useField({
    path: pathFromProps || name,
    validate,
  })

  return (
    <div
      className={[fieldBaseClass, 'confirm-password', showError && 'error']
        .filter(Boolean)
        .join(' ')}
    >
      <FieldError path={path} />
      <FieldLabel
        htmlFor="field-confirm-password"
        label={t('authentication:confirmPassword')}
        required
      />
      <input
        autoComplete="off"
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
