'use client'
import type { FormField } from 'payload/types'

import React, { useCallback } from 'react'

import type { Props } from './types.js'

import { useTranslation } from '../../../providers/Translation/index.js'
import Error from '../../Error/index.js'
import { useFormFields } from '../../Form/context.js'
import Label from '../../Label/index.js'
import { useField } from '../../useField/index.js'
import { fieldBaseClass } from '../shared.js'
import './index.scss'

const ConfirmPassword: React.FC<Props> = (props) => {
  const { disabled } = props

  const password = useFormFields<FormField>(([fields]) => fields.password)
  const { i18n, t } = useTranslation()

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

  const { errorMessage, setValue, showError, value } = useField({
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
      <Error path={path} />
      <Label
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

export default ConfirmPassword
