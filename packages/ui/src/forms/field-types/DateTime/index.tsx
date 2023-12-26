import React from 'react'

import type { Props } from './types'

import { date as dateValidation } from 'payload/fields/validations'
import { DateTimeInput } from './Input'
import './index.scss'
import FieldDescription from '../../FieldDescription'
import { fieldBaseClass } from '../shared'
import DefaultLabel from '../../Label'
import DefaultError from '../../Error'

const baseClass = 'date-time-field'

const DateTime: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { beforeInput, afterInput, Label, Error },
      date,
      description,
      placeholder,
      readOnly,
      style,
      width,
    } = {},
    label,
    path: pathFromProps,
    required,
    validate = dateValidation,
  } = props

  const path = pathFromProps || name

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        // showError && `${baseClass}--has-error`,
        readOnly && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__error-wrap`}>
        <ErrorComp
        // message={errorMessage}
        // showError={showError}
        />
      </div>
      <LabelComp htmlFor={path} label={label} required={required} />
      <div className={`${baseClass}__input-wrapper`} id={`field-${path.replace(/\./g, '__')}`}>
        {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
        <DateTimeInput
          datePickerProps={date}
          placeholder={placeholder}
          readOnly={readOnly}
          path={path}
          style={style}
          width={width}
        />
        {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
      </div>
      <FieldDescription description={description} path={path} />
    </div>
  )
}

export default DateTime
