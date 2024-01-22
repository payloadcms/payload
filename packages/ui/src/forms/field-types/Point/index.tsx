import React from 'react'

import type { Props } from './types'

import { getTranslation } from '@payloadcms/translations'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import { NumberInputWrapper } from '../Number/Wrapper'
import { PointInput } from './Input'

import './index.scss'

const baseClass = 'point'

const PointField: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label, afterInput, beforeInput } = {},
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
    i18n,
    i18n: { t },
    value,
  } = props

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  const path = pathFromProps || name

  return (
    <NumberInputWrapper
      className={[className, baseClass].filter(Boolean).join(' ')}
      readOnly={readOnly}
      style={style}
      width={width}
      path={path}
    >
      <ErrorComp path={path} />
      <ul className={`${baseClass}__wrap`}>
        <li>
          <LabelComp
            htmlFor={`field-longitude-${path.replace(/\./g, '__')}`}
            label={`${getTranslation(label || name, i18n)} - ${t('fields:longitude')}`}
            required={required}
            i18n={i18n}
          />
          <div className="input-wrapper">
            {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
            <PointInput
              path={path}
              placeholder={placeholder}
              readOnly={readOnly}
              step={step}
              required={required}
              isLatitude={false}
            />
            {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
          </div>
        </li>
        <li>
          <LabelComp
            htmlFor={`field-latitude-${path.replace(/\./g, '__')}`}
            label={`${getTranslation(label || name, i18n)} - ${t('fields:latitude')}`}
            required={required}
            i18n={i18n}
          />
          <div className="input-wrapper">
            {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
            <PointInput
              path={path}
              placeholder={placeholder}
              readOnly={readOnly}
              step={step}
              required={required}
            />
            {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
          </div>
        </li>
      </ul>
      <FieldDescription description={description} path={path} value={value} i18n={i18n} />
    </NumberInputWrapper>
  )
}

export default PointField
