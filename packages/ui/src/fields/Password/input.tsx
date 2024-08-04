'use client'
import type { ChangeEvent } from 'react'

import React from 'react'

import type { PasswordInputProps } from './types.js'

import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export const PasswordInput: React.FC<PasswordInputProps> = (props) => {
  const {
    Description,
    Error,
    Label,
    afterInput,
    autoComplete = 'off',
    beforeInput,
    className,
    errorProps,
    inputRef,
    label,
    labelProps,
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

  return (
    <div
      className={[
        fieldBaseClass,
        'password',
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
      <FieldLabel
        CustomLabel={Label}
        htmlFor={`field-${path.replace(/\./g, '__')}`}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError CustomError={Error} path={path} {...(errorProps || {})} />
        <div>
          <RenderComponent mappedComponent={beforeInput} />
          <input
            aria-label={label}
            autoComplete={autoComplete}
            data-rtl={rtl}
            disabled={readOnly}
            id={`field-${path.replace(/\./g, '__')}`}
            name={path}
            onChange={onChange as (e: ChangeEvent<HTMLInputElement>) => void}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            ref={inputRef}
            type="password"
            value={value || ''}
          />
          <RenderComponent mappedComponent={afterInput} />
        </div>
        <RenderComponent mappedComponent={Description} />
      </div>
    </div>
  )
}
