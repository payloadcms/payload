'use client'
import type {
  EmailFieldClientComponent,
  EmailFieldClientProps,
  EmailFieldValidation,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const EmailFieldComponent: EmailFieldClientComponent = (props) => {
  const {
    AfterInput,
    autoComplete,
    BeforeInput,
    Description,
    Error,
    field: {
      name,
      _path: pathFromProps,
      admin: {
        className,
        placeholder,
        readOnly: readOnlyFromAdmin,
        style,
        width,
      } = {} as EmailFieldClientProps['field']['admin'],
      label,
      required,
    } = {} as EmailFieldClientProps['field'],
    Label,
    readOnly: readOnlyFromTopLevelProps,
    validate,
  } = props

  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

  const { i18n } = useTranslation()

  const memoizedValidate: EmailFieldValidation = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const path = pathFromProps ?? name

  const { formInitializing, formProcessing, setValue, showError, value } = useField({
    path,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || formProcessing || formInitializing

  return (
    <div
      className={[fieldBaseClass, 'email', className, showError && 'error', disabled && 'read-only']
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      {Label || <FieldLabel label={label} required={required} />}
      <div className={`${fieldBaseClass}__wrap`}>
        {Error}
        {BeforeInput}
        {/* disable eslint here because the label is dynamic */}
        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
        <input
          autoComplete={autoComplete}
          disabled={disabled}
          id={`field-${path.replace(/\./g, '__')}`}
          name={path}
          onChange={setValue}
          placeholder={getTranslation(placeholder, i18n)}
          required={required}
          type="email"
          value={(value as string) || ''}
        />
        {AfterInput}
      </div>
      {Description}
    </div>
  )
}

export const EmailField = withCondition(EmailFieldComponent)
