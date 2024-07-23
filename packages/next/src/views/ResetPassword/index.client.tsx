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
  useFormFields,
  useTranslation,
} from '@payloadcms/ui'
import { formatAdminURL } from '@payloadcms/ui/shared'
import { useRouter } from 'next/navigation.js'
import React from 'react'
import { toast } from 'sonner'

type Args = {
  token: string
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
    admin: {
      routes: { login: loginRoute },
      user: userSlug,
    },
    routes: { admin: adminRoute, api: apiRoute },
    serverURL,
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
    [fetchFullUser, history, adminRoute, i18n],
  )

  return (
    <Form
      action={`${serverURL}${apiRoute}/${userSlug}/reset-password`}
      initialState={initialState}
      method="POST"
      onSuccess={onSuccess}
    >
      <PasswordToConfirm />
      <ConfirmPasswordField />
      <HiddenField forceUsePathFromProps name="token" value={token} />
      <FormSubmit>{i18n.t('authentication:resetPassword')}</FormSubmit>
    </Form>
  )
}

const PasswordToConfirm = () => {
  const { t } = useTranslation()
  const { value: confirmValue } = useFormFields(
    ([fields]) => (fields && fields?.['confirm-password']) || null,
  )

  const validate = React.useCallback(
    (value: string) => {
      if (!value) {
        return t('validation:required')
      }

      if (value === confirmValue) {
        return true
      }

      return t('fields:passwordsDoNotMatch')
    },
    [confirmValue, t],
  )

  return (
    <PasswordField
      autoComplete="off"
      label={t('authentication:newPassword')}
      name="password"
      required
      validate={validate}
    />
  )
}
