'use client'
import type { TextFieldClientProps } from 'payload'

import { ConfirmPasswordField, PasswordField } from '@payloadcms/ui'
import React from 'react'

export const CustomPasswordField: React.FC<TextFieldClientProps> = (props) => {
  return <PasswordField {...props} />
}

export const CustomPasswordFieldReadOnly: React.FC<TextFieldClientProps> = (props) => {
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

export const CustomConfirmPasswordField: React.FC<TextFieldClientProps> = ({ path }) => {
  return <ConfirmPasswordField path={path} />
}

export const CustomConfirmPasswordFieldDisabled: React.FC<TextFieldClientProps> = ({ path }) => {
  return <ConfirmPasswordField disabled path={path} />
}
