import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { email } from '../../../../../fields/validations'
import { getTranslation } from '../../../../../utilities/getTranslation'
import Error from '../../Error'
import FieldDescription from '../../FieldDescription'
import Label from '../../Label'
import useField from '../../useField'
import withCondition from '../../withCondition'
import './index.scss'

const Email: React.FC<Props> = (props) => {
  const {
    admin: {
      autoComplete,
      className,
      condition,
      description,
      placeholder,
      readOnly,
      style,
      width,
    } = {},
    label,
    name,
    path: pathFromProps,
    required,
    validate = email,
  } = props

  const { i18n } = useTranslation()

  const path = pathFromProps || name

  const memoizedValidate = useCallback(
    (value, options) => {
      return validate(value, { ...options, required })
    },
    [validate, required],
  )

  const fieldType = useField({
    condition,
    path,
    validate: memoizedValidate,
  })

  const { errorMessage, setValue, showError, value } = fieldType

  const classes = ['field-type', 'email', className, showError && 'error', readOnly && 'read-only']
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <Error message={errorMessage} showError={showError} />
      <Label htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
      <input
        autoComplete={autoComplete}
        disabled={Boolean(readOnly)}
        id={`field-${path.replace(/\./g, '__')}`}
        name={path}
        onChange={setValue}
        placeholder={getTranslation(placeholder, i18n)}
        type="email"
        value={(value as string) || ''}
      />
      <FieldDescription description={description} value={value} />
    </div>
  )
}

export default withCondition(Email)
