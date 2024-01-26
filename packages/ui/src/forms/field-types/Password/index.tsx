'use client'
import React, { useCallback } from 'react'

import type { Props } from './types'
import { withCondition } from '../../withCondition'
import { fieldBaseClass } from '../shared'
import { Validate } from 'payload/types'
import useField from '../../useField'

import './index.scss'

export const Password: React.FC<Props> = (props) => {
  const {
    autoComplete,
    className,
    disabled,
    required,
    style,
    width,
    validate,
    path: pathFromProps,
    name,
    Error,
    Label,
  } = props

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') return validate(value, { ...options, required })
    },
    [validate, required],
  )

  const { formProcessing, setValue, showError, value, path } = useField({
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
