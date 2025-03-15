'use client'
import type { PointFieldClientComponent, PointFieldValidation } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useMemo } from 'react'

import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js'
import { FieldDescription } from '../../fields/FieldDescription/index.js'
import { FieldError } from '../../fields/FieldError/index.js'
import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { mergeFieldStyles } from '../mergeFieldStyles.js'
import './index.scss'
import { fieldBaseClass } from '../shared/index.js'

const baseClass = 'point'

export const PointFieldComponent: PointFieldClientComponent = (props) => {
  const {
    field,
    field: {
      admin: { className, description, placeholder, step } = {},
      label,
      localized,
      required,
    },
    path,
    readOnly,
    validate,
  } = props

  const { i18n, t } = useTranslation()

  const memoizedValidate: PointFieldValidation = useCallback(
    (value, options) => {
      if (typeof validate === 'function') {
        return validate(value, { ...options, required })
      }
    },
    [validate, required],
  )

  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
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

  const getCoordinateFieldLabel = (type: 'latitude' | 'longitude') => {
    const suffix = type === 'longitude' ? t('fields:longitude') : t('fields:latitude')
    const fieldLabel = label ? getTranslation(label, i18n) : ''

    return `${fieldLabel}${fieldLabel ? ' - ' : ''}${suffix}`
  }

  const styles = useMemo(() => mergeFieldStyles(field), [field])

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && 'error',
        (readOnly || disabled) && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      style={styles}
    >
      <ul className={`${baseClass}__wrap`}>
        <li>
          <RenderCustomComponent
            CustomComponent={Label}
            Fallback={
              <FieldLabel
                label={getCoordinateFieldLabel('longitude')}
                localized={localized}
                path={path}
                required={required}
              />
            }
          />
          <div className="input-wrapper">
            {BeforeInput}
            {/* disable eslint rule because the label is dynamic */}
            {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
            <input
              disabled={readOnly || disabled}
              id={`field-longitude-${path?.replace(/\./g, '__')}`}
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
          <RenderCustomComponent
            CustomComponent={Label}
            Fallback={
              <FieldLabel
                label={getCoordinateFieldLabel('latitude')}
                localized={localized}
                path={path}
                required={required}
              />
            }
          />
          <div className="input-wrapper">
            <RenderCustomComponent
              CustomComponent={Error}
              Fallback={<FieldError path={path} showError={showError} />}
            />
            {BeforeInput}
            {/* disable eslint rule because the label is dynamic */}
            {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
            <input
              disabled={readOnly || disabled}
              id={`field-latitude-${path?.replace(/\./g, '__')}`}
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
      <RenderCustomComponent
        CustomComponent={Description}
        Fallback={<FieldDescription description={description} path={path} />}
      />
    </div>
  )
}

export const PointField = withCondition(PointFieldComponent)
