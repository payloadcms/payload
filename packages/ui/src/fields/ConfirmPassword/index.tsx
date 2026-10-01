'use client'

import { confirmPassword } from 'payload/shared'
import React, { useState } from 'react'

import { useForm } from '../../forms/Form/context.js'
import { useField } from '../../forms/useField/index.js'
import { EyeIcon } from '../../icons/Eye/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { generateFieldID } from '../../utilities/generateFieldID.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.css'

export type ConfirmPasswordFieldProps = {
  readonly disabled?: boolean
  readonly path?: string
  /**
   * Controls the height of the input. Defaults to `'large'`.
   */
  readonly size?: 'large' | 'medium'
}

export const ConfirmPasswordField: React.FC<ConfirmPasswordFieldProps> = (props) => {
  const { disabled: disabledFromProps, path = 'confirm-password', size = 'large' } = props
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

  const { uuid } = useForm()
  const editDepth = useEditDepth()
  const errorID = showError ? generateFieldID(path, editDepth, uuid, 'field-error') : undefined

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
      data-size={size}
    >
      <FieldLabel
        hasRequiredAccessibleState
        htmlFor="field-confirm-password"
        label={t('authentication:confirmPassword')}
        required
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError path={path} />
        <div className="confirm-password__input-wrap">
          <input
            aria-describedby={errorID}
            aria-invalid={showError || undefined}
            aria-label={t('authentication:confirmPassword')}
            aria-required
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
