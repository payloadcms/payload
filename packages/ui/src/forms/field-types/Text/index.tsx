import React from 'react'

import type { Props } from './types'
import { TextInput } from './Input'
import FieldDescription from '../../FieldDescription'
import DefaultError from '../../Error'
import DefaultLabel from '../../Label'
import { TextInputWrapper } from './Wrapper'

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
    value,
    i18n,
  } = props

  const path = pathFromProps || name

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  return (
    <TextInputWrapper className={className} style={style} width={width} path={path}>
      <ErrorComp path={path} />
      <LabelComp
        htmlFor={`field-${path.replace(/\./g, '__')}`}
        label={label}
        required={required}
        i18n={i18n}
      />
      <div>
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
        value={value}
        i18n={i18n}
      />
    </TextInputWrapper>
  )
}

export default Text
