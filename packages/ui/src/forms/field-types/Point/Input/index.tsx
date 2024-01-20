'use client'
import React, { useCallback } from 'react'
import useField from '../../../useField'
import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '../../../../providers/Translation'
import { Validate } from 'payload/types'

export const PointInput: React.FC<{
  path: string
  placeholder?: Record<string, string> | string
  step?: number
  readOnly?: boolean
  isLatitude?: boolean
  validate?: Validate
  required?: boolean
}> = (props) => {
  const { path, placeholder, step, readOnly, isLatitude = true, validate, required } = props
  const { i18n } = useTranslation()

  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === 'function') return validate(value, { ...options, required })
    },
    [validate, required],
  )

  const { setValue, value = [null, null] } = useField<[number, number]>({
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
    <input
      disabled={readOnly}
      id={`field-${isLatitude ? 'latitude' : 'longitude'}-${path.replace(/\./g, '__')}`}
      name={`${path}.${isLatitude ? 'latitude' : 'longitude'}`}
      onChange={(e) => handleChange(e, isLatitude ? 1 : 0)}
      placeholder={getTranslation(placeholder, i18n)}
      step={step}
      type="number"
      value={
        value && typeof value[isLatitude ? 1 : 0] === 'number' ? value[isLatitude ? 1 : 0] : ''
      }
    />
  )
}
