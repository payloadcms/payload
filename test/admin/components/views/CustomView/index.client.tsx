'use client'

import {
  ConfirmPasswordField,
  Form,
  FormSubmit,
  PasswordField,
  useFormFields,
} from '@payloadcms/ui'
import React from 'react'

export const ClientForm: React.FC = () => {
  return (
    <Form
      initialState={{
        'confirm-password': {
          initialValue: '',
          valid: false,
          value: '',
        },
        password: {
          initialValue: '',
          valid: false,
          value: '',
        },
      }}
    >
      <CustomPassword />
      <ConfirmPasswordField />
      <FormSubmit>Submit</FormSubmit>
    </Form>
  )
}

const CustomPassword: React.FC = () => {
  const confirmPassword = useFormFields(
    ([fields]) => (fields && fields?.['confirm-password']) || null,
  )

  const confirmValue = confirmPassword.value

  return (
    <PasswordField
      autoComplete="off"
      field={{
        name: 'password',
        label: 'Password',
        required: true,
      }}
      path="password"
      validate={(value) => {
        if (value && confirmValue) {
          return confirmValue === value ? true : 'Passwords must match!!!!'
        }

        return 'Field is required'
      }}
    />
  )
}
