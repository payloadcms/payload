import React from 'react'
import { useTranslation } from 'react-i18next'

import type { DateField } from '../../../../../exports/types'
import type { Description } from '../../FieldDescription/types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import DatePicker from '../../../elements/DatePicker'
import Error from '../../Error'
import FieldDescription from '../../FieldDescription'
import Label from '../../Label'
import { fieldBaseClass } from '../shared'
import './index.scss'

const baseClass = 'date-time-field'

export type DateTimeInputProps = Omit<DateField, 'admin' | 'name' | 'type'> & {
  className?: string
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
        <Error message={errorMessage} showError={showError} />
      </div>
      <Label htmlFor={path} label={label} required={required} />
      <div className={`${baseClass}__input-wrapper`} id={`field-${path.replace(/\./g, '__')}`}>
        <DatePicker
          {...datePickerProps}
          onChange={onChange}
          placeholder={getTranslation(placeholder, i18n)}
          readOnly={readOnly}
          value={value}
        />
      </div>
      <FieldDescription description={description} value={value} />
    </div>
  )
}
