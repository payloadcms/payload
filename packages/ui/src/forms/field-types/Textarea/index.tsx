import React from 'react'
import type { Props } from './types'
import { isFieldRTL } from '../shared'
import TextareaInput from './Input'
import DefaultError from '../../Error'
import DefaultLabel from '../../Label'
import FieldDescription from '../../FieldDescription'
import { TextareaInputWrapper } from './Wrapper'

import './index.scss'

const Textarea: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label, afterInput, beforeInput } = {},
      description,
      placeholder,
      readOnly,
      rows,
      rtl,
      style,
      width,
    } = {},
    label,
    localized,
    maxLength,
    minLength,
    path: pathFromProps,
    required,
    value,
    locale,
    config: { localization },
    i18n,
  } = props

  const path = pathFromProps || name

  const isRTL = isFieldRTL({
    fieldLocalized: localized,
    fieldRTL: rtl,
    locale,
    localizationConfig: localization || undefined,
  })

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  return (
    <TextareaInputWrapper
      className={className}
      readOnly={readOnly}
      style={style}
      width={width}
      path={path}
    >
      <ErrorComp path={path} />
      <LabelComp
        htmlFor={`field-${path.replace(/\./g, '__')}`}
        label={label}
        required={required}
        i18n={i18n}
      />
      <label className="textarea-outer" htmlFor={`field-${path.replace(/\./g, '__')}`}>
        <div className="textarea-inner">
          <div className="textarea-clone" data-value={value || placeholder || ''} />
          {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
          <TextareaInput
            name={name}
            path={path}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            rows={rows}
            rtl={isRTL}
            maxLength={maxLength}
            minLength={minLength}
          />
          {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
        </div>
      </label>
      <FieldDescription description={description} path={path} value={value} i18n={i18n} />
    </TextareaInputWrapper>
  )
}
export default Textarea
