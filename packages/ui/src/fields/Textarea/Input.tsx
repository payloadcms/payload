'use client'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { TextAreaInputProps } from './types.js'

import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

export const TextareaInput: React.FC<TextAreaInputProps> = (props) => {
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
    Label,
    label,
    labelProps,
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
    width,
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
        <label className="textarea-outer" htmlFor={`field-${path.replace(/\./g, '__')}`}>
          <div className="textarea-inner">
            <div className="textarea-clone" data-value={value || placeholder || ''} />
            <textarea
              className="textarea-element"
              data-rtl={rtl}
              disabled={readOnly}
              id={`field-${path.replace(/\./g, '__')}`}
              name={path}
              onChange={onChange}
              placeholder={getTranslation(placeholder, i18n)}
              rows={rows}
              value={value || ''}
            />
          </div>
        </label>
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
