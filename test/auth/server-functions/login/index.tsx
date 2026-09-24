'use client'

import type { FormState } from 'payload'

import { Banner, EmailField, Form, FormSubmit, PasswordField } from '@payloadcms/ui'
import { email } from 'payload/shared'
import { useState } from 'react'

export type LoginArgs = {
  email: string
  password: string
}

type Props = {
  dashboardURL: string
  loginFunction: (args: LoginArgs) => Promise<unknown>
}

const initialState: FormState = {
  serverFunctionEmail: {
    initialValue: '',
    valid: true,
    value: '',
  },
  serverFunctionPassword: {
    initialValue: '',
    valid: true,
    value: '',
  },
}

export const LoginForm = ({ dashboardURL, loginFunction }: Props) => {
  const [error, setError] = useState<null | string>(null)
  const [isPending, setIsPending] = useState(false)

  const handleLogin = async ({ email, password }: LoginArgs) => {
    setError(null)
    setIsPending(true)

    try {
      await loginFunction({ email, password })
      window.location.assign(dashboardURL)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed')
      setIsPending(false)
    }
  }

  return (
    <Form
      disabled={isPending}
      initialState={initialState}
      onSubmit={(_, data) => {
        void handleLogin({
          email: String(data.serverFunctionEmail),
          password: String(data.serverFunctionPassword),
        })
      }}
    >
      <EmailField
        field={{
          name: 'serverFunctionEmail',
          admin: {
            autoComplete: 'email',
          },
          label: 'Email',
          required: true,
        }}
        path="serverFunctionEmail"
        validate={email}
      />
      <PasswordField
        autoComplete="current-password"
        field={{
          name: 'serverFunctionPassword',
          label: 'Password',
          required: true,
        }}
        path="serverFunctionPassword"
      />
      {error && (
        <div role="alert">
          <Banner type="danger">{error}</Banner>
        </div>
      )}
      <FormSubmit>Custom Login</FormSubmit>
    </Form>
  )
}
