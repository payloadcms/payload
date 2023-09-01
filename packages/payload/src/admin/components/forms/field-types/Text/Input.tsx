import type { ChangeEvent } from 'react'

import React from 'react'
import { useTranslation } from 'react-i18next'

import type { TextField } from '../../../../../fields/config/types'
import type { Description } from '../../FieldDescription/types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import Error from '../../Error'
import FieldDescription from '../../FieldDescription'
import Label from '../../Label'
import './index.scss'

export type TextInputProps = Omit<TextField, 'type'> & {
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

  const classes = ['field-type', 'text', className, showError && 'error', readOnly && 'read-only']
    .filter(Boolean)
    .join(' ')

  return (
    <div
      style={{
        ...style,
        width,
      }}
      className={classes}
    >
      <Error message={errorMessage} showError={showError} />
      <Label htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
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
      <FieldDescription
        className={`field-description-${path.replace(/\./g, '__')}`}
        description={description}
        value={value}
      />
    </div>
  )
}

export default TextInput
