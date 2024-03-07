'use client'
import type { ChangeEvent } from 'react'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { Option } from '../../../elements/ReactSelect/types.d.ts'

import ReactSelect from '../../../elements/ReactSelect/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { type FormFieldBase, fieldBaseClass } from '../shared.js'
import './index.scss'

export type TextInputProps = Omit<FormFieldBase, 'type'> & {
  hasMany?: boolean
  inputRef?: React.MutableRefObject<HTMLInputElement>
  maxRows?: number
  minRows?: number
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  showError?: boolean
  value?: string
  valueToRender?: Option[]
}

export const TextInput: React.FC<TextInputProps> = (props) => {
  const {
    AfterInput,
    BeforeInput,
    Description,
    Error,
    Label,
    className,
    hasMany,
    inputRef,
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
      {Error}
      {Label}
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
      {Description}
    </div>
  )
}
