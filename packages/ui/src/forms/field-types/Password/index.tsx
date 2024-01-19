import React from 'react'

import type { Props } from './types'
import Error from '../../Error'
import Label from '../../Label'
import { PasswordInput } from './Input'
import { PasswordInputWrapper } from './Wrapper'

import './index.scss'

export const Password: React.FC<Props> = (props) => {
  const {
    name,
    autoComplete,
    className,
    disabled,
    label,
    path: pathFromProps,
    required,
    style,
    width,
    i18n,
  } = props

  const path = pathFromProps || name

  return (
    <PasswordInputWrapper className={className} style={style} width={width} path={path}>
      <Error path={path} />
      <Label
        htmlFor={`field-${path.replace(/\./g, '__')}`}
        label={label}
        required={required}
        i18n={i18n}
      />
      <PasswordInput name={name} autoComplete={autoComplete} disabled={disabled} path={path} />
    </PasswordInputWrapper>
  )
}

export default Password
