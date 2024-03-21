/* eslint-disable react/destructuring-assignment */
'use client'
import type { ClientValidate, FieldBase } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const baseClass = 'point'

import { FieldDescription } from '@payloadcms/ui/forms/FieldDescription'
import { FieldError } from '@payloadcms/ui/forms/FieldError'
import { FieldLabel } from '@payloadcms/ui/forms/FieldLabel'

import type { FormFieldBase } from '../shared/index.js'

export type PointFieldProps = FormFieldBase & {
  label?: FieldBase['label']
  name?: string
  path?: string
  placeholder?: string
  step?: number
  width?: string
}

const PointField: React.FC<PointFieldProps> = (props) => {
  const {
    name,
    AfterInput,
    BeforeInput,
    CustomDescription,
    CustomError,
    CustomLabel,
    className,
    descriptionProps,
    errorProps,
    labelProps,
    path: pathFromProps,
    placeholder,
    readOnly,
    required,
    step,
    style,
    validate,
    width,
  } = props

  const { i18n } = useTranslation()

  const memoizedValidate: ClientValidate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const {
    path,
    setValue,
    showError,
    value = [null, null],
  } = useField<[number, number]>({
    path: pathFromProps || name,
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
      <FieldError CustomError={CustomError} {...(errorProps || {})} />
      <ul className={`${baseClass}__wrap`}>
        <li>
          <FieldLabel CustomLabel={CustomLabel} {...(labelProps || {})} />
          <div className="input-wrapper">
            {BeforeInput}
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
            {AfterInput}
          </div>
        </li>
        <li>
          <FieldLabel CustomLabel={CustomLabel} {...(labelProps || {})} />
          <div className="input-wrapper">
            {BeforeInput}
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
            {AfterInput}
          </div>
        </li>
      </ul>
      {CustomDescription !== undefined ? (
        CustomDescription
      ) : (
        <FieldDescription {...(descriptionProps || {})} />
      )}
    </div>
  )
}

export const Point = withCondition(PointField)
