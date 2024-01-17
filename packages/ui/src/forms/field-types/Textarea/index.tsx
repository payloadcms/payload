import React from 'react'
import type { Props } from './types'
import { fieldBaseClass, isFieldRTL } from '../shared'
import TextareaInput from './Input'
import DefaultError from '../../Error'
import DefaultLabel from '../../Label'
import FieldDescription from '../../FieldDescription'
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
    valid,
    errorMessage,
    value,
    locale,
    config: { localization },
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
    <div
      className={[fieldBaseClass, 'textarea', className, !valid && 'error', readOnly && 'read-only']
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <ErrorComp message={errorMessage} showError={!valid} />
      <LabelComp htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
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
      <FieldDescription description={description} path={path} value={value} />
    </div>
  )
}
export default Textarea
