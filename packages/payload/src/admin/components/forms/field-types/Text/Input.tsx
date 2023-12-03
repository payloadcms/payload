import type { ChangeEvent } from 'react'

import React from 'react'
import { useTranslation } from 'react-i18next'

import type { TextField } from '../../../../../fields/config/types'
import type { Description } from '../../FieldDescription/types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import { fieldBaseClass } from '../shared'
import './index.scss'

export type TextInputProps = Omit<TextField, 'type'> & {
  Error?: React.ComponentType<any>
  Label?: React.ComponentType<any>
  afterInput?: React.ComponentType<any>[]
  beforeInput?: React.ComponentType<any>[]
  className?: string
  description?: Description
  errorMessage?: string
  inputRef?: React.MutableRefObject<HTMLInputElement>
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  path: string
  placeholder?: Record<string, string> | string
  readOnly?: boolean
  required?: boolean
  rtl?: boolean
  showError?: boolean
  style?: React.CSSProperties
  value?: string
  width?: string
}

const TextInput: React.FC<TextInputProps> = (props) => {
  const {
    Error,
    Label,
    afterInput,
    beforeInput,
    className,
    description,
    errorMessage,
    inputRef,
    label,
    onChange,
    onKeyDown,
    path,
    placeholder,
    readOnly,
    required,
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
      className={[fieldBaseClass, 'text', className, showError && 'error', readOnly && 'read-only']
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <ErrorComp message={errorMessage} showError={showError} />
      <LabelComp htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
      <div className="input-wrapper">
        {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
        <input
          data-rtl={rtl}
          disabled={readOnly}
          id={`field-${path.replace(/\./g, '__')}`}
          name={path}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={getTranslation(placeholder, i18n)}
          ref={inputRef}
          type="text"
          value={value || ''}
        />
        {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
      </div>
      <FieldDescription
        className={`field-description-${path.replace(/\./g, '__')}`}
        path={path}
        description={description}
        value={value}
      />
    </div>
  )
}

export default TextInput
