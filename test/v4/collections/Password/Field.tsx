'use client'
import type { TextFieldClientComponent } from 'payload'

import { ConfirmPasswordField, PasswordField } from '@payloadcms/ui'
import React from 'react'

export const CustomPasswordField: TextFieldClientComponent = (props) => {
  return <PasswordField {...props} />
}

export const CustomPasswordFieldReadOnly: TextFieldClientComponent = (props) => {
  return (
    <PasswordField
      {...props}
      field={{
        ...props.field,
        admin: {
          ...props.field.admin,
          disabled: true,
        },
      }}
    />
  )
}

export const CustomConfirmPasswordField: TextFieldClientComponent = ({ path }) => {
  return <ConfirmPasswordField path={path} />
}

export const CustomConfirmPasswordFieldDisabled: TextFieldClientComponent = ({ path }) => {
  return <ConfirmPasswordField disabled path={path} />
}
