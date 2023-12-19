'use client'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { FormLoadingOverlayToggle } from '../../elements/Loading'
import Form from '../../forms/Form'
import FormSubmit from '../../forms/Submit'
import Email from '../../forms/field-types/Email'
import Password from '../../forms/field-types/Password'
import { useAuth } from '../../providers/Auth'
import { useConfig } from '../../providers/Config'
import { useRouter, useSearchParams } from 'next/navigation'
import './index.scss'
import Link from 'next/link'

const baseClass = 'login-form'

export const LoginForm: React.FC<{
  action: (formData: FormData) => Promise<void>
}> = ({ action }) => {
  const { push } = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation('authentication')
  const { fetchFullUser, user } = useAuth()
  const config = useConfig()
  const {
    admin: { autoLogin },
    routes: { admin },
  } = config

  // Fetch 'redirect' from the query string which denotes the URL the user originally tried to visit. This is set in the Routes.tsx file when a user tries to access a protected route and is redirected to the login screen.
  const redirect = searchParams.get('redirect')

  const onSuccess = async (data) => {
    if (data.token) {
      await fetchFullUser()

      // Ensure the redirect always starts with the admin route, and concatenate the redirect path
      push(admin + (redirect || ''))
    }
  }

  const prefillForm = autoLogin && autoLogin.prefillOnly

  return (
    <Form
      action="/api/users/login"
      className={`${baseClass}__form`}
      disableSuccessStatus
      initialData={
        prefillForm
          ? {
              email: autoLogin.email,
              password: autoLogin.password,
            }
          : undefined
      }
      method="POST"
      onSuccess={onSuccess}
      waitForAutocomplete
    >
      <FormLoadingOverlayToggle action="loading" name="login-form" />
      <div className={`${baseClass}__inputWrap`}>
        <Email admin={{ autoComplete: 'email' }} label={t('general:email')} name="email" required />
        <Password autoComplete="off" label={t('general:password')} name="password" required />
      </div>
      <Link href={`${admin}/forgot`}>{t('forgotPasswordQuestion')}</Link>
      <FormSubmit>{t('login')}</FormSubmit>
    </Form>
  )
}
