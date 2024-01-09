'use client'
import React, { useCallback } from 'react'
import { useTranslation } from '../../../providers/Translation'

import type { Props } from './types'

import { getTranslation } from '@payloadcms/translations'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import useField from '../../useField'
import { fieldBaseClass } from '../shared'
import './index.scss'
import { Validate } from 'payload/types'

const baseClass = 'point'

const PointField: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label, afterInput, beforeInput } = {},
      condition,
      description,
      placeholder,
      readOnly,
      step,
      style,
      width,
    } = {},
    label,
    path: pathFromProps,
    required,
    validate,
  } = props

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  const path = pathFromProps || name

  const { i18n, t } = useTranslation()

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') return validate(value, { ...options, required })
    },
    [validate, required],
  )

  const {
    errorMessage,
    setValue,
    showError,
    value = [null, null],
  } = useField<[number, number]>({
    path,
    validate: memoizedValidate,
  })

  const handleChange = useCallback(
    (e, index: 0 | 1) => {
      let val = parseFloat(e.target.value)
      if (Number.isNaN(val)) {
        val = e.target.value
      }
      const coordinates = [...value]
      coordinates[index] = val
      setValue(coordinates)
    },
    [setValue, value],
  )

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
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
      <ErrorComp message={errorMessage} showError={showError} />
      <ul className={`${baseClass}__wrap`}>
        <li>
          <LabelComp
            htmlFor={`field-longitude-${path.replace(/\./g, '__')}`}
            label={`${getTranslation(label || name, i18n)} - ${t('fields:longitude')}`}
            required={required}
          />
          <div className="input-wrapper">
            {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
            <input
              disabled={readOnly}
              id={`field-longitude-${path.replace(/\./g, '__')}`}
              name={`${path}.longitude`}
              onChange={(e) => handleChange(e, 0)}
              placeholder={getTranslation(placeholder, i18n)}
              step={step}
              type="number"
              value={value && typeof value[0] === 'number' ? value[0] : ''}
            />
            {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
          </div>
        </li>
        <li>
          <LabelComp
            htmlFor={`field-latitude-${path.replace(/\./g, '__')}`}
            label={`${getTranslation(label || name, i18n)} - ${t('fields:latitude')}`}
            required={required}
          />
          <div className="input-wrapper">
            {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
            <input
              disabled={readOnly}
              id={`field-latitude-${path.replace(/\./g, '__')}`}
              name={`${path}.latitude`}
              onChange={(e) => handleChange(e, 1)}
              placeholder={getTranslation(placeholder, i18n)}
              step={step}
              type="number"
              value={value && typeof value[1] === 'number' ? value[1] : ''}
            />
            {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
          </div>
        </li>
      </ul>
      <FieldDescription description={description} path={path} value={value} />
    </div>
  )
}

export default PointField
