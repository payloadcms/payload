import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { email } from '../../../../../fields/validations'
import { getTranslation } from '../../../../../utilities/getTranslation'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import useField from '../../useField'
import withCondition from '../../withCondition'
import { fieldBaseClass } from '../shared'
import './index.scss'

const Email: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      autoComplete,
      className,
      components: { Error, Label, afterInput, beforeInput } = {},
      condition,
      description,
      placeholder,
      readOnly,
      style,
      width,
    } = {},
    label,
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

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  return (
    <div
      className={[fieldBaseClass, 'email', className, showError && 'error', readOnly && 'read-only']
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <ErrorComp message={errorMessage} showError={showError} />
      <LabelComp htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
      <div className="input-wrapper">
        {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
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
        {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
      </div>
      <FieldDescription description={description} path={path} value={value} />
    </div>
  )
}

export default withCondition(Email)
