'use client'
import type { ClientValidate } from 'payload/types'

import React, { useCallback } from 'react'

import type { Props } from './types.js'

import LabelComp from '../../Label/index.js'
import { useField } from '../../useField/index.js'
import { withCondition } from '../../withCondition/index.js'
import { fieldBaseClass } from '../shared.js'
import './index.scss'

export const Password: React.FC<Props> = (props) => {
  const {
    name,
    Error,
    Label: LabelFromProps,
    autoComplete,
    className,
    disabled,
    label,
    path: pathFromProps,
    required,
    style,
    validate,
    width,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const memoizedValidate: ClientValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { formProcessing, path, setValue, showError, value } = useField({
    path: pathFromProps || name,
    validate: memoizedValidate,
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
      {Error}
      {Label}
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

export default withCondition(Password)
