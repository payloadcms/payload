'use client'
import type { PointFieldProps, PointFieldValidation } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { useCallback } from 'react'

import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { fieldBaseClass } from '../shared/index.js'
import './index.scss'

const baseClass = 'point'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { FieldDescription } from '../FieldDescription/index.js'
import { FieldError } from '../FieldError/index.js'
import { FieldLabel } from '../FieldLabel/index.js'

export const PointFieldComponent: React.FC<PointFieldProps> = (props) => {
  const {
    descriptionProps,
    errorProps,
    field,
    field: {
      name,
      _path: pathFromProps,
      admin: {
        className,
        description,
        placeholder,
        readOnly: readOnlyFromProps,
        step,
        style,
        width,
      },
      label,
      required,
    },
    labelProps,
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

  const { path: pathFromContext, readOnly: readOnlyFromContext } = useFieldProps()
  const readOnly = readOnlyFromProps || readOnlyFromContext

  const {
    path,
    setValue,
    showError,
    value = [null, null],
  } = useField<[number, number]>({
    path: pathFromContext ?? pathFromProps ?? name,
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

    return {
      ...labelProps,
      label: `${fieldLabel}${fieldLabel ? ' - ' : ''}${suffix}`,
    }
  }

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
      <ul className={`${baseClass}__wrap`}>
        <li>
          <FieldLabel
            Label={field?.admin?.components?.Label}
            {...getCoordinateFieldLabel('longitude')}
          />
          <div className="input-wrapper">
            <RenderComponent mappedComponent={field?.admin?.components?.beforeInput} />
            {/* disable eslint rule because the label is dynamic */}
            {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
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
            <RenderComponent mappedComponent={field?.admin?.components?.afterInput} />
          </div>
        </li>
        <li>
          <FieldLabel
            Label={field?.admin?.components?.Label}
            {...getCoordinateFieldLabel('latitude')}
          />
          <div className="input-wrapper">
            <FieldError
              CustomError={field?.admin?.components?.Error}
              path={path}
              {...(errorProps || {})}
            />
            <RenderComponent mappedComponent={field?.admin?.components?.beforeInput} />
            {/* disable eslint rule because the label is dynamic */}
            {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
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
            <RenderComponent mappedComponent={field?.admin?.components?.afterInput} />
          </div>
        </li>
      </ul>
      <FieldDescription
        Description={field?.admin?.components?.Description}
        description={description}
        {...(descriptionProps || {})}
      />
    </div>
  )
}

export const PointField = withCondition(PointFieldComponent)
