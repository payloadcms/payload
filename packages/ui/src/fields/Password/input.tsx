'use client'
import type { ChangeEvent } from 'react'

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
    AfterInput,
    autoComplete = 'off',
    BeforeInput,
    className,
    description,
    Description,
    Error,
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
    style,
    value,
    width,
  } = props

  const { i18n, t } = useTranslation()
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
      style={{
        ...style,
        width,
      }}
    >
      <RenderCustomComponent
        CustomComponent={Label}
        Fallback={
          <FieldLabel label={label} localized={localized} path={path} required={required} />
        }
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <RenderCustomComponent
          CustomComponent={Error}
          Fallback={<FieldError path={path} showError={showError} />}
        />
        <div className="password__input-wrap">
          {BeforeInput}
          <input
            aria-label={getTranslation(label, i18n)}
            autoComplete={autoComplete}
            className="form-input"
            data-rtl={rtl}
            disabled={readOnly}
            id={`field-${path.replace(/\./g, '__')}`}
            name={path}
            onChange={onChange as (e: ChangeEvent<HTMLInputElement>) => void}
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
