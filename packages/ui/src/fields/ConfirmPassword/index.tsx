'use client'

import { confirmPassword } from 'payload/shared'
import React, { useState } from 'react'

import { useField } from '../../forms/useField/index.js'
import { EyeIcon } from '../../icons/Eye/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.css'

export type ConfirmPasswordFieldProps = {
  readonly disabled?: boolean
  readonly path?: string
}

export const ConfirmPasswordField: React.FC<ConfirmPasswordFieldProps> = (props) => {
  const { disabled: disabledFromProps, path = 'confirm-password' } = props
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)

  const { disabled, setValue, showError, value } = useField({
    path,
    validate: (value, options) => {
      return confirmPassword(value, {
        name: 'confirm-password',
        type: 'text',
        required: true,
        ...options,
      })
    },
  })

  const isDisabled = !!(disabled || disabledFromProps)

  return (
    <div
      className={[
        fieldBaseClass,
        'confirm-password',
        showError && 'error',
        isDisabled && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <FieldLabel
        htmlFor="field-confirm-password"
        label={t('authentication:confirmPassword')}
        required
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError path={path} />
        <div className="confirm-password__input-wrap">
          <input
            aria-label={t('authentication:confirmPassword')}
            autoComplete="off"
            className="form-input"
            disabled={isDisabled}
            id="field-confirm-password"
            name="confirm-password"
            onChange={setValue}
            type={showPassword ? 'text' : 'password'}
            value={(value as string) || ''}
          />
          <button
            aria-label={t(showPassword ? 'fields:hidePassword' : 'fields:showPassword')}
            className="confirm-password__toggle-button"
            disabled={isDisabled}
            onClick={() => setShowPassword((prev) => !prev)}
            type="button"
          >
            <EyeIcon active={showPassword} size={24} />
          </button>
        </div>
      </div>
    </div>
  )
}
