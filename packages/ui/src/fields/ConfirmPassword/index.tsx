'use client'
import type { FormField } from 'payload/types'

import React, { useCallback } from 'react'

import { FieldError } from '../../forms/FieldError/index.js'
import { FieldLabel } from '../../forms/FieldLabel/index.js'
import { useFormFields } from '../../forms/Form/context.js'
import { useField } from '../../forms/useField/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export type ConfirmPasswordFieldProps = {
  disabled?: boolean
}

export const ConfirmPassword: React.FC<ConfirmPasswordFieldProps> = (props) => {
  const { disabled } = props

  const password = useFormFields<FormField>(([fields]) => fields?.password)
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

  const path = 'confirm-password'

  const { setValue, showError, value } = useField({
    disableFormData: true,
    path,
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
        disabled={!!disabled}
        id="field-confirm-password"
        name="confirm-password"
        onChange={setValue}
        type="password"
        value={(value as string) || ''}
      />
    </div>
  )
}
