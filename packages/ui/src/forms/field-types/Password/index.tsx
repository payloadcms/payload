import React from 'react'

import type { Props } from './types'

import { password } from 'payload/fields/validations'
import Error from '../../Error'
import Label from '../../Label'
import './index.scss'
import { fieldBaseClass } from '../shared'
import { PasswordInput } from './Input'

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
    validate = password,
    width,
  } = props

  const path = pathFromProps || name

  return (
    <div
      className={[
        fieldBaseClass,
        'password',
        className,
        // showError && 'error'/
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        width,
      }}
    >
      <Error
        message=""
        // message={errorMessage}
        // showError={showError}
      />
      <Label htmlFor={`field-${path.replace(/\./g, '__')}`} label={label} required={required} />
      <PasswordInput name={name} autoComplete={autoComplete} disabled={disabled} path={path} />
    </div>
  )
}

export default Password
