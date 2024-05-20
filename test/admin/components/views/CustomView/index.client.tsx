'use client'
import { ConfirmPassword } from '@payloadcms/ui/fields/ConfirmPassword'
import { Password } from '@payloadcms/ui/fields/Password'
import { Form, useFormFields } from '@payloadcms/ui/forms/Form'
import { FormSubmit } from '@payloadcms/ui/forms/Submit'
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
      <ConfirmPassword />
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
    <Password
      autoComplete="off"
      label="Password"
      name="password"
      required
      validate={(value) => {
        if (value && confirmValue) {
          return confirmValue === value ? true : 'Passwords must match!!!!'
        }

        return 'Field is required'
      }}
    />
  )
}
