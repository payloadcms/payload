import type { ChangeEvent } from 'react'

import React from 'react'
import { useTranslation } from 'react-i18next'

import type { TextareaField } from '../../../../../fields/config/types'
import type { Description } from '../../FieldDescription/types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import { fieldBaseClass } from '../shared'
import './index.scss'

export type TextAreaInputProps = Omit<TextareaField, 'type'> & {
  Error?: React.ComponentType<any>
  Label?: React.ComponentType<any>
  afterInput?: React.ComponentType<any>[]
  beforeInput?: React.ComponentType<any>[]
  className?: string
  description?: Description
  errorMessage?: string
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void
  path: string
  placeholder?: Record<string, string> | string
  readOnly?: boolean
  required?: boolean
  rows?: number
  rtl?: boolean
  showError?: boolean
  style?: React.CSSProperties
  value?: string
  width?: string
}

const TextareaInput: React.FC<TextAreaInputProps> = (props) => {
  const {
    Error,
    Label,
    afterInput,
    beforeInput,
    className,
    description,
    errorMessage,
    label,
    onChange,
    path,
    placeholder,
    readOnly,
    required,
    rows,
    rtl,
    showError,
    style,
    value,
    width,
  } = props

  const { i18n } = useTranslation()

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  return (
    <div
      className={[
        fieldBaseClass,
        'textarea',
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
      <ErrorComp message={errorMessage} showError={showError} />
      <LabelComp htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
      <label className="textarea-outer" htmlFor={`field-${path.replace(/\./g, '__')}`}>
        <div className="textarea-inner">
          <div className="textarea-clone" data-value={value || placeholder || ''} />
          {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
          <textarea
            className="textarea-element"
            data-rtl={rtl}
            disabled={readOnly}
            id={`field-${path.replace(/\./g, '__')}`}
            name={path}
            onChange={onChange}
            placeholder={getTranslation(placeholder, i18n)}
            rows={rows}
            value={value || ''}
          />
          {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
        </div>
      </label>
      <FieldDescription description={description} path={path} value={value} />
    </div>
  )
}

export default TextareaInput
