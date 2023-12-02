import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { FormField } from '../../Form/types'
import type { Props } from './types'

import Error from '../../Error'
import { useFormFields } from '../../Form/context'
import Label from '../../Label'
import useField from '../../useField'
import './index.scss'
import { fieldBaseClass } from '../shared'

const ConfirmPassword: React.FC<Props> = (props) => {
  const { disabled } = props

  const password = useFormFields<FormField>(([fields]) => fields.password)
  const { t } = useTranslation('fields')

  const validate = useCallback(
    (value: string) => {
      if (!value) {
        return t('validation:required')
      }

      if (value === password?.value) {
        return true
      }

      return t('passwordsDoNotMatch')
    },
    [password, t],
  )

  const { errorMessage, setValue, showError, value } = useField({
    disableFormData: true,
    path: 'confirm-password',
    validate,
  })

  return (
    <div
      className={[fieldBaseClass, 'confirm-password', showError && 'error']
        .filter(Boolean)
        .join(' ')}
    >
      <Error message={errorMessage} showError={showError} />
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
