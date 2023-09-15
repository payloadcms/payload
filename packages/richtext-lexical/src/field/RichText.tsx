import { Error, FieldDescription, Label, useField, withCondition } from 'payload/components/forms'
import React, { useCallback } from 'react'

import type { FieldProps } from '../types'

import './index.scss'

const baseClass = 'rich-text-lexical'

const RichText: React.FC<FieldProps> = (props) => {
  const {
    name,
    admin: { className, condition, description, readOnly, style, width } = {
      className,
      condition,
      description,
      readOnly,
      style,
      width,
    },
    admin,
    defaultValue: defaultValueFromProps,
    label,
    path: pathFromProps,
    required,
    validate = null, // TODO:
  } = props

  const path = pathFromProps || name

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      return validate(value, { ...validationOptions, required })
    },
    [validate, required],
  )

  const fieldType = useField({
    condition,
    path,
    validate: memoizedValidate,
  })

  const { errorMessage, initialValue, setValue, showError, value } = fieldType

  const classes = [
    baseClass,
    'field-type',
    className,
    showError && 'error',
    readOnly && `${baseClass}--read-only`,
  ]
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
      <div className={`${baseClass}__wrap`}>
        <Error message={errorMessage} showError={showError} />
        <Label htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
        <p>TODO: RichText editor here</p>
        <FieldDescription description={description} value={value} />
      </div>
    </div>
  )
}
export default withCondition(RichText)
