'use client'
import type { CSSProperties } from 'react'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { TextAreaInputProps } from './types.js'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldError } from '../../fields/FieldError/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export const TextareaInput: React.FC<TextAreaInputProps> = (props) => {
  const {
    AfterInput,
    BeforeInput,
    className,
    Description,
    description,
    Error,
    Label,
    label,
    localized,
    onChange,
    path,
    placeholder,
    readOnly,
    required,
    rows,
    rtl,
    showError,
    style,
    value,
  } = props

  const { i18n } = useTranslation()

  return (
    <div
      className={[
        fieldBaseClass,
        'textarea',
        className,
        showError && 'error',
        readOnly && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <RenderCustomComponent
        CustomComponent={Label}
        Fallback={
          <FieldLabel
            htmlFor={`field-${path.replace(/\./g, '__')}`}
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
          Fallback={<FieldError path={path} showError={showError} />}
        />
        {BeforeInput}
        <div className="textarea-outer">
          <textarea
            data-rtl={rtl}
            disabled={readOnly}
            id={`field-${path.replace(/\./g, '__')}`}
            name={path}
            onChange={onChange}
            placeholder={getTranslation(placeholder, i18n)}
            rows={rows}
            style={
              {
                '--rows': rows,
              } as CSSProperties
            }
            value={value || ''}
          />
        </div>
        {AfterInput}
        <RenderCustomComponent
          CustomComponent={Description}
          Fallback={<FieldDescription description={description} path={path} />}
        />
      </div>
    </div>
  )
}
