import React from 'react'

import type { Props } from './types'
import DefaultError from '../../Error'
import FieldDescription from '../../FieldDescription'
import DefaultLabel from '../../Label'
import { EmailInput } from './Input'
import { EmailInputWrapper } from './Wrapper'

import './index.scss'

export const Email: React.FC<Props> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label, afterInput, beforeInput } = {},
      description,
      autoComplete,
      readOnly,
      style,
      width,
    } = {},
    label,
    path: pathFromProps,
    required,
    i18n,
    value,
  } = props

  const path = pathFromProps || name

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  return (
    <EmailInputWrapper
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
      <div>
        {Array.isArray(beforeInput) && beforeInput.map((Component, i) => <Component key={i} />)}
        <EmailInput
          name={name}
          autoComplete={autoComplete}
          readOnly={readOnly}
          path={path}
          required={required}
        />
        {Array.isArray(afterInput) && afterInput.map((Component, i) => <Component key={i} />)}
      </div>
      <FieldDescription description={description} path={path} i18n={i18n} value={value} />
    </EmailInputWrapper>
  )
}

export default Email
