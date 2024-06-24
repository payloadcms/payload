'use client'
import type { FormState } from 'payload/types'

import { ConfirmPassword } from '@payloadcms/ui/fields/ConfirmPassword'
import { HiddenInput } from '@payloadcms/ui/fields/HiddenInput'
import { Password } from '@payloadcms/ui/fields/Password'
import { Form, useFormFields } from '@payloadcms/ui/forms/Form'
import { FormSubmit } from '@payloadcms/ui/forms/Submit'
import { useAuth } from '@payloadcms/ui/providers/Auth'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import { useRouter } from 'next/navigation.js'
import React from 'react'
import { toast } from 'react-toastify'

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
    admin: { user: userSlug },
    routes: { admin, api },
    serverURL,
  } = useConfig()

  const history = useRouter()

  const { fetchFullUser } = useAuth()

  const onSuccess = React.useCallback(
    async (data) => {
      if (data.token) {
        await fetchFullUser()
        history.push(`${admin}`)
      } else {
        history.push(`${admin}/login`)
        toast.success(i18n.t('general:updatedSuccessfully'), { autoClose: 3000 })
      }
    },
    [fetchFullUser, history, admin, i18n],
  )

  return (
    <Form
      action={`${serverURL}${api}/${userSlug}/reset-password`}
      initialState={initialState}
      method="POST"
      onSuccess={onSuccess}
    >
      <PasswordToConfirm />
      <ConfirmPassword />
      <HiddenInput forceUsePathFromProps name="token" value={token} />
      <FormSubmit>{i18n.t('authentication:resetPassword')}</FormSubmit>
    </Form>
  )
}

const PasswordToConfirm = () => {
  const { t } = useTranslation()
  const { value: confirmValue } = useFormFields(([fields]) => {
    return fields['confirm-password']
  })

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
    <Password
      autoComplete="off"
      label={t('authentication:newPassword')}
      name="password"
      required
      validate={validate}
    />
  )
}
