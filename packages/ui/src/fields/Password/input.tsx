'use client'
import type { ChangeEvent } from 'react'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { PasswordInputProps } from './types.js'

import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export const PasswordInput: React.FC<PasswordInputProps> = (props) => {
  const {
    AfterInput,
    autoComplete = 'off',
    BeforeInput,
    className,
    Description,
    Error,
    inputRef,
    Label,
    label,
    onChange,
    onKeyDown,
    path,
    placeholder,
    readOnly,
    rtl,
    showError,
    style,
    value,
    width,
  } = props

  const { i18n } = useTranslation()

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
      {Label}
      <div className={`${fieldBaseClass}__wrap`}>
        {Error}
        <div>
          {BeforeInput}
          <input
            aria-label={getTranslation(label, i18n)}
            autoComplete={autoComplete}
            data-rtl={rtl}
            disabled={readOnly}
            id={`field-${path.replace(/\./g, '__')}`}
            name={path}
            onChange={onChange as (e: ChangeEvent<HTMLInputElement>) => void}
            onKeyDown={onKeyDown}
            placeholder={getTranslation(placeholder, i18n)}
            ref={inputRef}
            type="password"
            value={value || ''}
          />
          {AfterInput}
        </div>
        {Description}
      </div>
    </div>
  )
}
