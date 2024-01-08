'use client'
import React from 'react'

import { FormLoadingOverlayToggle } from '../../elements/Loading'
import Form from '../../forms/Form'
import FormSubmit from '../../forms/Submit'
import { Email } from '../../forms/field-types/Email'
import { Password } from '../../forms/field-types/Password'
import Link from 'next/link'
import { useTranslation } from '../../providers/Translation'
import { useConfig } from '../../providers/Config'

import './index.scss'

const baseClass = 'login-form'

export const LoginForm: React.FC<{
  action?: (formData: FormData) => Promise<void> | string
  searchParams: { [key: string]: string | string[] | undefined }
}> = async ({ searchParams }) => {
  const config = useConfig()
  const {
    admin: { autoLogin, user: userSlug },
    routes: { admin, api },
  } = config

  const { t } = useTranslation()

  const prefillForm = autoLogin && autoLogin.prefillOnly

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
      method="POST"
      redirect={`${admin}${searchParams?.redirect || ''}`}
      waitForAutocomplete
    >
      <FormLoadingOverlayToggle action="loading" name="login-form" />
      <div className={`${baseClass}__inputWrap`}>
        <Email admin={{ autoComplete: 'email' }} label={t('general:email')} name="email" required />
        <Password autoComplete="off" label={t('general:password')} name="password" required />
      </div>
      <Link href={`${admin}/forgot`}>{t('authentication:forgotPasswordQuestion')}</Link>
      <FormSubmit>{t('authentication:login')}</FormSubmit>
    </Form>
  )
}
