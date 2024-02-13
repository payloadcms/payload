'use client'
import React, { useCallback } from 'react'
import type { Props } from './types'
import { fieldBaseClass, isFieldRTL } from '../shared'
import { withCondition } from '../../withCondition'
import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '../../../providers/Translation'
import useField from '../../useField'
import { Validate } from 'payload/types'
import { useConfig } from '../../../providers/Config'
import LabelComp from '../../Label'

import './index.scss'

const Textarea: React.FC<Props> = (props) => {
  const {
    name,
    className,
    placeholder,
    readOnly,
    rtl,
    style,
    width,
    localized,
    maxLength,
    minLength,
    path: pathFromProps,
    required,
    locale,
    Error,
    Label: LabelFromProps,
    BeforeInput,
    AfterInput,
    validate,
    Description,
    label,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const rows = 'rows' in props ? props.rows : undefined

  const { i18n } = useTranslation()

  const { localization } = useConfig()

  const isRTL = isFieldRTL({
    fieldLocalized: localized,
    fieldRTL: rtl,
    locale,
    localizationConfig: localization || undefined,
  })

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function')
        return validate(value, { ...options, maxLength, minLength, required })
    },
    [validate, required],
  )

  const { setValue, value, path, showError } = useField<string>({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

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
      {Error}
      {Label}
      {BeforeInput}
      <label className="textarea-outer" htmlFor={`field-${path.replace(/\./g, '__')}`}>
        <div className="textarea-inner">
          <div className="textarea-clone" data-value={value || placeholder || ''} />
          <textarea
            className="textarea-element"
            data-rtl={isRTL}
            disabled={readOnly}
            id={`field-${path.replace(/\./g, '__')}`}
            name={path}
            onChange={setValue}
            placeholder={getTranslation(placeholder, i18n)}
            rows={rows}
            value={value || ''}
          />
        </div>
      </label>
      {AfterInput}
      {Description}
    </div>
  )
}

export default withCondition(Textarea)
