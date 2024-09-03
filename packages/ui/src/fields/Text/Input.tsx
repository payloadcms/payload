'use client'
import type { ChangeEvent } from 'react'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { TextInputProps } from './types.js'

import { ReactSelect } from '../../elements/ReactSelect/index.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export const TextInput: React.FC<TextInputProps> = (props) => {
  const {
    afterInput,
    beforeInput,
    className,
    Description,
    description,
    descriptionProps,
    Error,
    errorProps,
    field,
    hasMany,
    inputRef,
    Label,
    label,
    labelProps,
    maxRows,
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
      <FieldLabel
        field={field}
        Label={Label}
        label={label}
        required={required}
        {...(labelProps || {})}
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError CustomError={Error} field={field} path={path} {...(errorProps || {})} />
        <RenderComponent mappedComponent={beforeInput} />
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
          <input
            data-rtl={rtl}
            disabled={readOnly}
            id={`field-${path?.replace(/\./g, '__')}`}
            name={path}
            onChange={onChange as (e: ChangeEvent<HTMLInputElement>) => void}
            onKeyDown={onKeyDown}
            placeholder={getTranslation(placeholder, i18n)}
            ref={inputRef}
            type="text"
            value={value || ''}
          />
        )}
        <RenderComponent mappedComponent={afterInput} />
        <FieldDescription
          Description={Description}
          description={description}
          field={field}
          {...(descriptionProps || {})}
        />
      </div>
    </div>
  )
}
