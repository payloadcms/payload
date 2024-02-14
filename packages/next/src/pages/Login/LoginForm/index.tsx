'use client'
import React from 'react'
import {
  Email,
  Form,
  FormLoadingOverlayToggle,
  FormState,
  FormSubmit,
  Password,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import Link from 'next/link'

const baseClass = 'login__form'

import './index.scss'

export const LoginForm: React.FC<{
  searchParams: { [key: string]: string | string[] | undefined }
}> = ({ searchParams }) => {
  const config = useConfig()

  const {
    admin: { autoLogin, user: userSlug },
    routes: { admin, api },
  } = config

  const { t } = useTranslation()

  const prefillForm = autoLogin && autoLogin.prefillOnly

  const initialState: FormState = {
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
  }

  return (
    <Form
      action={`${api}/${userSlug}/login`}
      className={`${baseClass}__form`}
      disableSuccessStatus
      initialState={initialState}
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
