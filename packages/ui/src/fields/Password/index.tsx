'use client'
import type { PasswordFieldValidation, PayloadRequest } from 'payload'

import { password } from 'payload/shared'
import React, { useCallback } from 'react'

import type { PasswordFieldProps } from './types.js'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { isFieldRTL } from '../shared/index.js'
import './index.scss'
import { PasswordInput } from './input.js'

const PasswordFieldComponent: React.FC<PasswordFieldProps> = (props) => {
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
        disabled: disabledFromProps,
        placeholder,
        rtl,
        style,
        width,
      } = {} as PasswordFieldProps['field']['admin'],
      label,
      required,
    } = {} as PasswordFieldProps['field'],
    inputRef,
    Label,
    validate,
  } = props

  const { t } = useTranslation()
  const locale = useLocale()
  const { config } = useConfig()

  const memoizedValidate: PasswordFieldValidation = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }

      return password(value, {
        name: 'password',
        type: 'text',
        data: {},
        preferences: { fields: {} },
        req: {
          payload: {
            config,
          },
          t,
        } as unknown as PayloadRequest,
        required: true,
        siblingData: {},
      })
    },
    [validate, config, t, required],
  )

  const { formInitializing, formProcessing, path, setValue, showError, value } = useField({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  const disabled = disabledFromProps || formInitializing || formProcessing

  const renderRTL = isFieldRTL({
    fieldLocalized: false,
    fieldRTL: rtl,
    locale,
    localizationConfig: config.localization || undefined,
  })

  return (
    <PasswordInput
      AfterInput={AfterInput}
      autoComplete={autoComplete}
      BeforeInput={BeforeInput}
      className={className}
      Description={Description}
      Error={Error}
      inputRef={inputRef}
      Label={Label}
      label={label}
      onChange={(e) => {
        setValue(e.target.value)
      }}
      path={path}
      placeholder={placeholder}
      readOnly={disabled}
      required={required}
      rtl={renderRTL}
      showError={showError}
      style={style}
      value={(value as string) || ''}
      width={width}
    />
  )
}

export const PasswordField = withCondition(PasswordFieldComponent)
