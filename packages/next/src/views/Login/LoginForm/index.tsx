'use client'

import LinkImport from 'next/link.js'
import React from 'react'

const baseClass = 'login__form'
const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

import type { FormState } from 'payload/types'

import { FormLoadingOverlayToggle } from '@payloadcms/ui/elements/Loading'
import { Email } from '@payloadcms/ui/fields/Email'
import { Password } from '@payloadcms/ui/fields/Password'
import { Form } from '@payloadcms/ui/forms/Form'
import { FormSubmit } from '@payloadcms/ui/forms/Submit'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useTranslation } from '@payloadcms/ui/providers/Translation'

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
      className={baseClass}
      disableSuccessStatus
      initialState={initialState}
      method="POST"
      redirect={typeof searchParams?.redirect === 'string' ? searchParams.redirect : admin}
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
