'use client'
import React, { useCallback } from 'react'

import type { Props } from './types'

import { getTranslation } from '@payloadcms/translations'
import useField from '../../useField'
import { fieldBaseClass } from '../shared'
import { Validate } from 'payload/types'
import { useTranslation } from '../../../providers/Translation'
import { withCondition } from '../../withCondition'

import './index.scss'

const baseClass = 'point'

const PointField: React.FC<Props> = (props) => {
  const {
    name,
    className,
    placeholder,
    readOnly,
    style,
    width,
    required,
    validate,
    path: pathFromProps,
    Error,
    BeforeInput,
    AfterInput,
    Label,
    Description,
  } = props

  const { i18n } = useTranslation()

  const step = 'step' in props ? props.step : 1

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') return validate(value, { ...options, required })
    },
    [validate, required],
  )

  const {
    setValue,
    value = [null, null],
    showError,
    path,
  } = useField<[number, number]>({
    validate: memoizedValidate,
    path: pathFromProps || name,
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
      {Error}
      <ul className={`${baseClass}__wrap`}>
        <li>
          {Label}
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
          {Label}
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
      {Description}
    </div>
  )
}

export default withCondition(PointField)
