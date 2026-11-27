'use client'
import { getTranslation } from '@payloadcms/translations'
import React, { useState } from 'react'

import type { PasswordInputProps } from './types.js'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldError } from '../../fields/FieldError/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { EyeIcon } from '../../icons/Eye/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.css'

const baseClass = 'password'

export const PasswordInput: React.FC<PasswordInputProps> = (props) => {
  const {
    id: idFromProps,
    AfterInput,
    autoComplete = 'off',
    BeforeInput,
    className,
    description,
    Description,
    Error,
    errorID: errorIDFromProps,
    inputRef,
    Label,
    label,
    localized,
    onChange,
    onKeyDown,
    path,
    placeholder,
    readOnly,
    required,
    rtl,
    showError,
    size = 'large',
    style,
    value,
    width,
  } = props

  const { i18n, t } = useTranslation()
  const inputID = idFromProps ?? `field-${path.replace(/\./g, '__')}`
  const errorID = showError
    ? (errorIDFromProps ?? `field-error-${path.replace(/\./g, '__')}`)
    : undefined

  const [showPassword, setShowPassword] = useState(false)

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && 'error',
        readOnly && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      data-size={size}
      style={{
        ...style,
        width,
      }}
    >
      <RenderCustomComponent
        CustomComponent={Label}
        Fallback={
          <FieldLabel
            hasRequiredAccessibleState
            htmlFor={inputID}
            label={label}
            localized={localized}
            path={path}
            required={required}
          />
        }
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <RenderCustomComponent
          CustomComponent={Error}
          Fallback={<FieldError id={errorID} path={path} showError={showError} />}
        />
        <div className="password__input-wrap">
          {BeforeInput}
          <input
            aria-describedby={errorID}
            aria-invalid={showError || undefined}
            aria-label={getTranslation(label, i18n)}
            aria-required={required || undefined}
            autoComplete={autoComplete}
            className="form-input"
            data-rtl={rtl}
            disabled={readOnly}
            id={inputID}
            name={path}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={getTranslation(placeholder, i18n)}
            ref={inputRef}
            type={showPassword ? 'text' : 'password'}
            value={value || ''}
          />
          <button
            aria-label={t(showPassword ? 'fields:hidePassword' : 'fields:showPassword')}
            className="password__toggle-button"
            disabled={readOnly}
            onClick={() => setShowPassword((prev) => !prev)}
            type="button"
          >
            <EyeIcon active={showPassword} size={24} />
          </button>
          {AfterInput}
        </div>
        <RenderCustomComponent
          CustomComponent={Description}
          Fallback={<FieldDescription description={description} path={path} />}
        />
      </div>
    </div>
  )
}
