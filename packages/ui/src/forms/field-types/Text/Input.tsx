'use client'

import React, { useCallback } from 'react'
import { getTranslation } from '@payloadcms/translations'
import type { SanitizedConfig, Validate } from 'payload/types'

import { useTranslation } from '../../../providers/Translation'
import { isFieldRTL } from '../shared'
import './index.scss'
import useField from '../../useField'
import { useLocale } from '../../../providers/Locale'

export const TextInput: React.FC<{
  name: string
  autoComplete?: string
  readOnly?: boolean
  path: string
  required?: boolean
  placeholder?: Record<string, string> | string
  localized?: boolean
  localizationConfig?: SanitizedConfig['localization']
  rtl?: boolean
  maxLength?: number
  minLength?: number
  validate?: Validate
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}> = (props) => {
  const {
    path,
    placeholder,
    readOnly,
    localized,
    localizationConfig,
    rtl,
    maxLength,
    minLength,
    validate,
    required,
    onKeyDown,
  } = props

  const { i18n } = useTranslation()
  const locale = useLocale()

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function')
        return validate(value, { ...options, maxLength, minLength, required })
    },
    [validate, minLength, maxLength, required],
  )

  const field = useField({
    path,
    validate: memoizedValidate,
  })

  const { setValue, value } = field

  const renderRTL = isFieldRTL({
    fieldLocalized: localized,
    fieldRTL: rtl,
    locale,
    localizationConfig: localizationConfig || undefined,
  })

  return (
    <input
      data-rtl={renderRTL}
      disabled={readOnly}
      id={`field-${path.replace(/\./g, '__')}`}
      name={path}
      onChange={(e) => {
        setValue(e.target.value)
      }}
      onKeyDown={onKeyDown}
      placeholder={getTranslation(placeholder, i18n)}
      // ref={inputRef}
      type="text"
      value={(value as string) || ''}
    />
  )
  // TODO hasMany text field:
  // return (
  //   <div
  //     className={[
  //       fieldBaseClass,
  //       'text',
  //       className,
  //       showError && 'error',
  //       readOnly && 'read-only',
  //       hasMany && 'has-many',
  //     ]
  //       .filter(Boolean)
  //       .join(' ')}
  //     style={{
  //       ...style,
  //       width,
  //     }}
  //   >
  //     <ErrorComp message={errorMessage} showError={showError} />
  //     <LabelComp htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
  //     <div className="input-wrapper">
  //       {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
  //       {hasMany ? (
  //         <ReactSelect
  //           className={`field-${path.replace(/\./g, '__')}`}
  //           disabled={readOnly}
  //           filterOption={(option, rawInput) => {
  //             const isOverHasMany = Array.isArray(value) && value.length >= maxRows
  //             return !isOverHasMany
  //           }}
  //           isClearable
  //           isCreatable
  //           isMulti
  //           isSortable
  //           noOptionsMessage={({ inputValue }) => {
  //             const isOverHasMany = Array.isArray(value) && value.length >= maxRows
  //             if (isOverHasMany) {
  //               return t('validation:limitReached', { max: maxRows, value: value.length + 1 })
  //             }
  //             return null
  //           }}
  //           onChange={onChange}
  //           options={[]}
  //           placeholder={t('general:enterAValue')}
  //           showError={showError}
  //           value={valueToRender}
  //         />
  //       ) : (
  //         <input
  //           data-rtl={rtl}
  //           disabled={readOnly}
  //           id={`field-${path.replace(/\./g, '__')}`}
  //           name={path}
  //           onChange={onChange}
  //           onKeyDown={onKeyDown}
  //           placeholder={getTranslation(placeholder, i18n)}
  //           ref={inputRef}
  //           type="text"
  //           value={value || ''}
  //         />
  //       )}
  //       {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
  //     </div>
  //     <FieldDescription
  //       className={`field-description-${path.replace(/\./g, '__')}`}
  //       description={description}
  //       path={path}
  //       value={value}
  //     />
  //   </div>
  // )
}
