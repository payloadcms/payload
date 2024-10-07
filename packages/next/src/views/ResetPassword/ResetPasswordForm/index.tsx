'use client'
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
import { type FormState } from 'payload'
import React from 'react'

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

export const ResetPasswordForm: React.FC<Args> = ({ token }) => {
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

  return (
    <Form
      action={`${serverURL}${apiRoute}/${userSlug}/reset-password`}
      initialState={initialState}
      method="POST"
      onSuccess={onSuccess}
    >
      <div className="inputWrap">
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
      </div>
      <FormSubmit size="large">{i18n.t('authentication:resetPassword')}</FormSubmit>
    </Form>
  )
}
