'use client'
import React, { useCallback } from 'react'

import type { Props } from './types'
import { withCondition } from '../../withCondition'
import { fieldBaseClass } from '../shared'
import { useTranslation } from '../../../providers/Translation'
import { Validate } from 'payload/types'
import useField from '../../useField'
import { getTranslation } from '@payloadcms/translations'

import './index.scss'

export const Email: React.FC<Props> = (props) => {
  const {
    name,
    className,
    path: pathFromProps,
    autoComplete,
    readOnly,
    style,
    width,
    Error,
    Label,
    BeforeInput,
    AfterInput,
    Description,
    required,
    validate,
    placeholder,
  } = props

  const { i18n } = useTranslation()

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { setValue, showError, value, path } = useField({
    validate: memoizedValidate,
    path: pathFromProps || name,
  })

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
      {Error}
      {Label}
      <div>
        {BeforeInput}
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
        {AfterInput}
      </div>
      {Description}
    </div>
  )
}

export default withCondition(Email)
