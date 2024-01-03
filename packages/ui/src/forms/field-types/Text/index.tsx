import React from 'react'

import type { Props } from './types'

import { fieldBaseClass } from '../shared'
import { TextInput } from './Input'
import FieldDescription from '../../FieldDescription'
import DefaultError from '../../Error'
import DefaultLabel from '../../Label'

const Text: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label, afterInput, beforeInput } = {},
      description,
      placeholder,
      readOnly,
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
  } = props

  const path = pathFromProps || name

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  return (
    <div
      className={[
        fieldBaseClass,
        'text',
        className,
        // showError && 'error', readOnly && 'read-only'
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <ErrorComp
      // message={errorMessage}
      // showError={showError}
      />
      <LabelComp htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
      <div className="input-wrapper">
        {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
        <TextInput
          path={path}
          name={name}
          localized={localized}
          rtl={rtl}
          placeholder={placeholder}
          readOnly={readOnly}
          maxLength={maxLength}
          minLength={minLength}
        />
        {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
      </div>
      <FieldDescription
        className={`field-description-${path.replace(/\./g, '__')}`}
        description={description}
        path={path}
        // value={value}
      />
    </div>
  )
}

export default Text
