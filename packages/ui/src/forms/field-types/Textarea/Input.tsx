'use client'
import React, { useCallback } from 'react'
import { useTranslation } from '../../../providers/Translation'

import type { TextareaField, Validate } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import useField from '../../useField'

import './index.scss'

export type TextAreaInputProps = Omit<TextareaField, 'type'> & {
  className?: string
  path: string
  placeholder?: Record<string, string> | string
  readOnly?: boolean
  required?: boolean
  rows?: number
  rtl?: boolean
}

const TextareaInput: React.FC<TextAreaInputProps> = (props) => {
  const { path, placeholder, readOnly, required, rows, rtl, validate, maxLength, minLength } = props

  const { i18n } = useTranslation()

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function')
        return validate(value, { ...options, maxLength, minLength, required })
    },
    [validate, required],
  )

  const { setValue, value } = useField<string>({
    path,
    validate: memoizedValidate,
  })

  return (
    <textarea
      className="textarea-element"
      data-rtl={rtl}
      disabled={readOnly}
      id={`field-${path.replace(/\./g, '__')}`}
      name={path}
      onChange={setValue}
      placeholder={getTranslation(placeholder, i18n)}
      rows={rows}
      value={value || ''}
    />
  )
}

export default TextareaInput
