'use client'
import type { FormState } from 'payload'

import {
  ConfirmPasswordField,
  Form,
  FormSubmit,
  HiddenField,
  PasswordField,
  useAuth,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import { formatAdminURL } from '@payloadcms/ui/shared'
import { useRouter } from 'next/navigation.js'
import React from 'react'
import { toast } from 'sonner'

type Args = {
  readonly token: string
}

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
}

export const ResetPasswordClient: React.FC<Args> = ({ token }) => {
  const i18n = useTranslation()
  const {
    config: {
      admin: {
        routes: { login: loginRoute },
        user: userSlug,
      },
      routes: { admin: adminRoute, api: apiRoute },
      serverURL,
    },
  } = useConfig()

  const history = useRouter()

  const { fetchFullUser } = useAuth()

  const onSuccess = React.useCallback(
    async (data) => {
      if (data.token) {
        await fetchFullUser()
        history.push(adminRoute)
      } else {
        history.push(
          formatAdminURL({
            adminRoute,
            path: loginRoute,
          }),
        )
        toast.success(i18n.t('general:updatedSuccessfully'))
      }
    },
    [adminRoute, fetchFullUser, history, i18n, loginRoute],
  )

  return (
    <Form
      action={`${serverURL}${apiRoute}/${userSlug}/reset-password`}
      initialState={initialState}
      method="POST"
      onSuccess={onSuccess}
    >
      <PasswordField
        field={{
          name: 'password',
          label: i18n.t('authentication:newPassword'),
          required: true,
        }}
      />
      <ConfirmPasswordField />
      <HiddenField
        field={{
          name: 'token',
        }}
        forceUsePathFromProps
        value={token}
      />
      <FormSubmit size="large">{i18n.t('authentication:resetPassword')}</FormSubmit>
    </Form>
  )
}
