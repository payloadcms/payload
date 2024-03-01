'use client'
import type { FormState } from '@payloadcms/ui'

import {
  Email,
  Form,
  FormLoadingOverlayToggle,
  FormSubmit,
  Password,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import Link from 'next/link'
import React from 'react'

const baseClass = 'login__form'

import { useRouter } from 'next/navigation'

import './index.scss'

export const LoginForm: React.FC<{
  searchParams: { [key: string]: string | string[] | undefined }
}> = ({ searchParams }) => {
  const config = useConfig()

  const {
    admin: { autoLogin, user: userSlug },
    routes: { admin, api },
  } = config

  const router = useRouter()
  const { t } = useTranslation()

  const prefillForm = autoLogin && autoLogin.prefillOnly

  const initialState: FormState = {
    email: {
      initialValue: prefillForm ? autoLogin.email : undefined,
      valid: true,
      value: prefillForm ? autoLogin.email : undefined,
    },
    password: {
      initialValue: prefillForm ? autoLogin.password : undefined,
      valid: true,
      value: prefillForm ? autoLogin.password : undefined,
    },
  }

  return (
    <Form
      action={`${api}/${userSlug}/login`}
      className={`${baseClass}__form`}
      disableSuccessStatus
      initialState={initialState}
      method="POST"
      onSuccess={() => {
        router.push(admin)
      }}
      redirect={typeof searchParams?.redirect === 'string' ? searchParams.redirect : ''}
      waitForAutocomplete
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
