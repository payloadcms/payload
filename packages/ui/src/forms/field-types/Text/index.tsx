'use client'
import React, { useCallback } from 'react'

import type { Props } from './types'
import { withCondition } from '../../withCondition'
import { fieldBaseClass, isFieldRTL } from '../shared'
import useField from '../../useField'
import { useTranslation } from '../../../providers/Translation'
import { useConfig, useLocale } from '../../..'
import { Validate } from 'payload/types'
import { getTranslation } from '@payloadcms/translations'

import './index.scss'

const Text: React.FC<Props> = (props) => {
  const {
    className,
    localized,
    maxLength,
    minLength,
    required,
    Error,
    Label,
    Description,
    BeforeInput,
    AfterInput,
    validate,
    inputRef,
    readOnly,
    width,
    style,
    onKeyDown,
    placeholder,
    rtl,
    name,
    path: pathFromProps,
  } = props

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

  const { setValue, value, path, showError } = useField({
    validate: memoizedValidate,
    path: pathFromProps || name,
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
