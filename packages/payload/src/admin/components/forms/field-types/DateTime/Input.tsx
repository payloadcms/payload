import React from 'react'
import { useTranslation } from 'react-i18next'

import type { DateField } from '../../../../../exports/types'
import type { Description } from '../../FieldDescription/types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import DatePicker from '../../../elements/DatePicker'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import { fieldBaseClass } from '../shared'
import './index.scss'

const baseClass = 'date-time-field'

export type DateTimeInputProps = Omit<DateField, 'admin' | 'name' | 'type'> & {
  className?: string
  components: {
    AfterInput?: React.ReactElement<any>[]
    BeforeInput?: React.ReactElement<any>[]
    Error?: React.ComponentType<any>
    Label?: React.ComponentType<any>
  }
  datePickerProps?: DateField['admin']['date']
  description?: Description
  errorMessage?: string
  onChange?: (e: Date) => void
  path: string
  placeholder?: Record<string, string> | string
  readOnly?: boolean
  required?: boolean
  showError?: boolean
  style?: React.CSSProperties
  value?: Date
  width?: string
}

export const DateTimeInput: React.FC<DateTimeInputProps> = (props) => {
  const {
    className,
    components: { AfterInput, BeforeInput, Error, Label },
    datePickerProps,
    description,
    errorMessage,
    label,
    onChange,
    path,
    placeholder,
    readOnly,
    required,
    showError,
    style,
    value,
    width,
  } = props

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  const { i18n } = useTranslation()

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        showError && `${baseClass}--has-error`,
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
        <ErrorComp message={errorMessage} showError={showError} />
      </div>
      <LabelComp htmlFor={path} label={label} required={required} />
      <div className={`${baseClass}__input-wrapper`} id={`field-${path.replace(/\./g, '__')}`}>
        {BeforeInput}
        <DatePicker
          {...datePickerProps}
          onChange={onChange}
          placeholder={getTranslation(placeholder, i18n)}
          readOnly={readOnly}
          value={value}
        />
        {AfterInput}
      </div>
      <FieldDescription description={description} value={value} />
    </div>
  )
}
