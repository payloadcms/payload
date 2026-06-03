'use client'
import {
  ConfirmPasswordField,
  Form,
  FormHeader,
  FormSubmit,
  HiddenField,
  PasswordField,
  useAuth,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import { type FormState } from 'payload'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import './index.css'

const baseClass = 'reset-password__form'

type Args = {
  readonly token: string
}

export const ResetPasswordForm: React.FC<Args> = ({ token }) => {
  const i18n = useTranslation()
  const {
    config: {
      admin: {
        routes: { login: loginRoute },
        user: userSlug,
      },
      routes: { admin: adminRoute, api: apiRoute },
    },
  } = useConfig()

  const history = useRouter()
  const { fetchFullUser } = useAuth()

  const onSuccess = React.useCallback(async () => {
    const user = await fetchFullUser()
    if (user) {
      history.push(adminRoute)
    } else {
      history.push(
        formatAdminURL({
          adminRoute,
          path: loginRoute,
        }),
      )
    }
  }, [adminRoute, fetchFullUser, history, loginRoute])

  const initialState: FormState = {
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
    token: {
      initialValue: token,
      valid: true,
      value: token,
    },
  }

  return (
    <Form
      action={formatAdminURL({
        apiRoute,
        path: `/${userSlug}/reset-password`,
      })}
      className={baseClass}
      initialState={initialState}
      method="POST"
      onSuccess={onSuccess}
    >
      <FormHeader heading={i18n.t('authentication:resetPassword')} />
      <div className={`${baseClass}__inputWrap`}>
        <PasswordField
          field={{
            name: 'password',
            label: i18n.t('authentication:newPassword'),
            required: true,
          }}
          path="password"
          schemaPath={`${userSlug}.password`}
        />
        <ConfirmPasswordField />
        <HiddenField path="token" schemaPath={`${userSlug}.token`} value={token} />
      </div>
      <div className={`${baseClass}__actions`}>
        <FormSubmit size="large">{i18n.t('authentication:resetPassword')}</FormSubmit>
      </div>
    </Form>
  )
}
