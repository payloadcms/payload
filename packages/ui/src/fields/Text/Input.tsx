'use client'
import { getTranslation } from '@payloadcms/translations'
import { FieldDescription } from '@payloadcms/ui/forms/FieldDescription'
import { FieldError } from '@payloadcms/ui/forms/FieldError'
import { FieldLabel } from '@payloadcms/ui/forms/FieldLabel'
import React from 'react'

import type { TextInputProps } from './types.js'

import { ReactSelect } from '../../elements/ReactSelect/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export const TextInput: React.FC<TextInputProps> = (props) => {
  const {
    AfterInput,
    BeforeInput,
    CustomDescription,
    CustomError,
    CustomLabel,
    className,
    descriptionProps,
    errorProps,
    hasMany,
    inputRef,
    labelProps,
    maxRows,
    onChange,
    onKeyDown,
    path,
    placeholder,
    readOnly,
    rtl,
    showError,
    style,
    value,
    valueToRender,
    width,
  } = props

  const { i18n, t } = useTranslation()

  return (
    <div
      className={[
        fieldBaseClass,
        'text',
        className,
        showError && 'error',
        readOnly && 'read-only',
        hasMany && 'has-many',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <FieldError CustomError={CustomError} {...(errorProps || {})} />
      <FieldLabel CustomLabel={CustomLabel} {...(labelProps || {})} />
      {hasMany ? (
        <ReactSelect
          className={`field-${path.replace(/\./g, '__')}`}
          disabled={readOnly}
          // prevent adding additional options if maxRows is reached
          filterOption={() =>
            !maxRows ? true : !(Array.isArray(value) && maxRows && value.length >= maxRows)
          }
          isClearable
          isCreatable
          isMulti
          isSortable
          noOptionsMessage={() => {
            const isOverHasMany = Array.isArray(value) && value.length >= maxRows
            if (isOverHasMany) {
              return t('validation:limitReached', { max: maxRows, value: value.length + 1 })
            }
            return null
          }}
          onChange={onChange}
          options={[]}
          placeholder={t('general:enterAValue')}
          showError={showError}
          value={valueToRender}
        />
      ) : (
        <div>
          {BeforeInput}
          <input
            data-rtl={rtl}
            disabled={readOnly}
            id={`field-${path?.replace(/\./g, '__')}`}
            name={path}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={getTranslation(placeholder, i18n)}
            ref={inputRef}
            type="text"
            value={value || ''}
          />
          {AfterInput}
        </div>
      )}
      {CustomDescription !== undefined ? (
        CustomDescription
      ) : (
        <FieldDescription {...(descriptionProps || {})} />
      )}
    </div>
  )
}
