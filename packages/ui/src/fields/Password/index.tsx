'use client'
import type { PasswordFieldValidation, PayloadRequest } from 'payload'

import { password } from 'payload/shared'
import React, { useCallback, useMemo } from 'react'

import type { PasswordFieldProps } from './types.js'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { mergeFieldStyles } from '../mergeFieldStyles.js'
import './index.scss'
import { isFieldRTL } from '../shared/index.js'
import { PasswordInput } from './input.js'

const PasswordFieldComponent: React.FC<PasswordFieldProps> = (props) => {
  const {
    autoComplete,
    field,
    field: {
      admin: {
        className,
        disabled: disabledFromProps,
        placeholder,
        rtl,
      } = {} as PasswordFieldProps['field']['admin'],
      label,
      localized,
      required,
    } = {} as PasswordFieldProps['field'],
    inputRef,
    path,
    validate,
  } = props

  const { t } = useTranslation()
  const locale = useLocale()
  const { config } = useConfig()

  const memoizedValidate: PasswordFieldValidation = useCallback(
    (value, options) => {
      const pathSegments = path ? path.split('.') : []

      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }

      return password(value, {
        name: 'password',
        type: 'text',
        blockData: {},
        data: {},
        event: 'onChange',
        path: pathSegments,
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
    [validate, config, t, required, path],
  )

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    setValue,
    showError,
    value,
  } = useField({
    path,
    validate: memoizedValidate,
  })

  const renderRTL = isFieldRTL({
    fieldLocalized: false,
    fieldRTL: rtl,
    locale,
    localizationConfig: config.localization || undefined,
  })

  const styles = useMemo(() => mergeFieldStyles(field), [field])

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
      localized={localized}
      onChange={(e) => {
        setValue(e.target.value)
      }}
      path={path}
      placeholder={placeholder}
      readOnly={disabled || disabledFromProps}
      required={required}
      rtl={renderRTL}
      showError={showError}
      style={styles}
      value={(value as string) || ''}
    />
  )
}

export const PasswordField = withCondition(PasswordFieldComponent)
