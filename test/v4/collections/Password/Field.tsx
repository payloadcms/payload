'use client'
import type { TextFieldClientComponent } from 'payload'

import { PasswordField } from '@payloadcms/ui'
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
