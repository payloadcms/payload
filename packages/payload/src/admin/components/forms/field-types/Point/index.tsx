import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { point } from '../../../../../fields/validations'
import { getTranslation } from '../../../../../utilities/getTranslation'
import Error from '../../Error'
import FieldDescription from '../../FieldDescription'
import Label from '../../Label'
import useField from '../../useField'
import withCondition from '../../withCondition'
import './index.scss'

const baseClass = 'point'

const PointField: React.FC<Props> = (props) => {
  const {
    admin: { className, condition, description, placeholder, readOnly, step, style, width } = {},
    label,
    name,
    path: pathFromProps,
    required,
    validate = point,
  } = props

  const path = pathFromProps || name

  const { i18n, t } = useTranslation('fields')

  const memoizedValidate = useCallback(
    (value, options) => {
      return validate(value, { ...options, required })
    },
    [validate, required],
  )

  const {
    errorMessage,
    setValue,
    showError,
    value = [null, null],
  } = useField<[number, number]>({
    condition,
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

  const classes = [
    'field-type',
    baseClass,
    className,
    showError && 'error',
    readOnly && 'read-only',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <Error message={errorMessage} showError={showError} />
      <ul className={`${baseClass}__wrap`}>
        <li>
          <Label
            htmlFor={`field-longitude-${path.replace(/\./g, '__')}`}
            label={`${getTranslation(label || name, i18n)} - ${t('longitude')}`}
            required={required}
          />
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
        </li>
        <li>
          <Label
            htmlFor={`field-latitude-${path.replace(/\./g, '__')}`}
            label={`${getTranslation(label || name, i18n)} - ${t('latitude')}`}
            required={required}
          />
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
        </li>
      </ul>
      <FieldDescription description={description} value={value} />
    </div>
  )
}

export default withCondition(PointField)
