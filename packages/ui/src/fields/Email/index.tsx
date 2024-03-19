'use client'
import type { ClientValidate } from 'payload/types'
import type { EmailField as EmailFieldType, FieldBase } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import type { FormFieldBase } from '../shared/index.js'

import { Label as LabelComp } from '../../forms/Label/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export type EmailFieldProps = FormFieldBase & {
  autoComplete?: string
  label?: FieldBase['label']
  name?: string
  path?: string
  placeholder?: EmailFieldType['admin']['placeholder']
  width?: string
}

const EmailField: React.FC<EmailFieldProps> = (props) => {
  const {
    name,
    AfterInput,
    BeforeInput,
    Description,
    Error,
    Label: LabelFromProps,
    autoComplete,
    className,
    label,
    path: pathFromProps,
    placeholder,
    readOnly,
    required,
    style,
    validate,
    width,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const { i18n } = useTranslation()

  const memoizedValidate: ClientValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const { path, setValue, showError, value } = useField({
    path: pathFromProps || name,
    validate: memoizedValidate,
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

export const Email = withCondition(EmailField)
