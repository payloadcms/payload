'use client'
import type { Validate } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import type { Props } from './types'

import { useConfig } from '../../../providers/Config'
import { useLocale } from '../../../providers/Locale'
import { useTranslation } from '../../../providers/Translation'
import LabelComp from '../../Label'
import useField from '../../useField'
import { withCondition } from '../../withCondition'
import { fieldBaseClass, isFieldRTL } from '../shared'
import './index.scss'

const Text: React.FC<Props> = (props) => {
  const {
    name,
    AfterInput,
    BeforeInput,
    Description,
    Error,
    Label: LabelFromProps,
    className,
    inputRef,
    label,
    hasMany,
    localized,
    minRows,
    maxLength,
    maxRows,
    minLength,
    onKeyDown,
    path: pathFromProps,
    placeholder,
    readOnly,
    required,
    rtl,
    style,
    validate,
    width,
  } = props

  const Label = LabelFromProps || <LabelComp label={label} required={required} />

  const { i18n } = useTranslation()

  const locale = useLocale()

  const { localization: localizationConfig } = useConfig()

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function')
        return validate(value, { ...options, maxLength, minLength, required })
    },
    [validate, minLength, maxLength, required],
  )

  const { path, schemaPath, setValue, showError, value } = useField({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  const renderRTL = isFieldRTL({
    fieldLocalized: localized,
    fieldRTL: rtl,
    locale,
    localizationConfig: localizationConfig || undefined,
  })

  return (
    <div
      className={[fieldBaseClass, 'text', className, showError && 'error', readOnly && 'read-only']
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      {Error}
      {Label}
      <div>
        {BeforeInput}
        <input
          data-rtl={renderRTL}
          disabled={readOnly}
          id={`field-${path?.replace(/\./g, '__')}`}
          name={path}
          onChange={(e) => {
            setValue(e.target.value)
          }}
          onKeyDown={onKeyDown}
          placeholder={getTranslation(placeholder, i18n)}
          ref={inputRef}
          type="text"
          value={(value as string) || ''}
        />
        {AfterInput}
      </div>
      {Description}
    </div>
  )
}

export default withCondition(Text)
