'use client'
import type { ClientValidate, PayloadRequest } from 'payload'

import { useConfig, useLocale, useTranslation } from '@payloadcms/ui'
import { password } from 'payload/shared'
import React, { useCallback } from 'react'

import type { PasswordFieldProps } from './types.js'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { isFieldRTL } from '../shared/index.js'
import './index.scss'
import { PasswordInput } from './input.js'

const PasswordFieldComponent: React.FC<PasswordFieldProps> = (props) => {
  const {
    autoComplete,
    clientFieldConfig: {
      name,
      _path: pathFromProps,
      admin: {
        className,
        components: {
          Description,
          Error,
          Label,
          afterInput,
          beforeInput,
        } = {} as PasswordFieldProps['clientFieldConfig']['admin']['components'],
        description,
        placeholder,
        rtl,
        style,
        width,
      } = {} as PasswordFieldProps['clientFieldConfig']['admin'],
      disabled: disabledFromProps,
      label,
      required,
    } = {} as PasswordFieldProps['clientFieldConfig'],
    errorProps,
    inputRef,
    labelProps,
    validate,
  } = props

  const { t } = useTranslation()
  const locale = useLocale()
  const { config } = useConfig()

  const memoizedValidate: ClientValidate = useCallback(
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
        } as PayloadRequest,
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
      Description={Description}
      Error={Error}
      Label={Label}
      afterInput={afterInput}
      autoComplete={autoComplete}
      beforeInput={beforeInput}
      className={className}
      description={description}
      errorProps={errorProps}
      inputRef={inputRef}
      label={label}
      labelProps={labelProps}
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
