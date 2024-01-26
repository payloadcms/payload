'use client'
import {
  Email,
  Form,
  FormLoadingOverlayToggle,
  FormSubmit,
  Password,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import React from 'react'

const baseClass = 'login__form'

import './index.scss'
import Link from 'next/link'

export const LoginForm: React.FC<{
  searchParams: { [key: string]: string | string[] | undefined }
}> = ({ searchParams }) => {
  const config = useConfig()

  const {
    admin: { autoLogin, user: userSlug },
    routes: { admin, api },
  } = config

  const prefillForm = autoLogin && autoLogin.prefillOnly

  const { t } = useTranslation()

  return (
    <Form
      action={`${api}/${userSlug}/login`}
      className={`${baseClass}__form`}
      disableSuccessStatus
      initialState={{
        email: {
          initialValue: prefillForm ? autoLogin.email : undefined,
          value: prefillForm ? autoLogin.email : undefined,
          valid: true,
        },
        password: {
          initialValue: prefillForm ? autoLogin.password : undefined,
          value: prefillForm ? autoLogin.password : undefined,
          valid: true,
        },
      }}
      redirect={`${admin}${searchParams?.redirect || ''}`}
      waitForAutocomplete
      method="POST"
    >
      <FormLoadingOverlayToggle action="loading" name="login-form" />
      <div className={`${baseClass}__inputWrap`}>
        <Email autoComplete="email" label={t('general:email')} name="email" required />
        <Password autoComplete="off" label={t('general:password')} name="password" required />
      </div>
      <Link href={`${admin}/forgot`}>{t('authentication:forgotPasswordQuestion')}</Link>
      <FormSubmit>{t('authentication:login')}</FormSubmit>
    </Form>
  )
}
