'use client'

import LinkImport from 'next/link.js'
import React from 'react'

const baseClass = 'login__form'
const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

import type { FormState, PayloadRequest } from 'payload'

import { Form, FormSubmit, PasswordField, useConfig, useTranslation } from '@payloadcms/ui'
import { password } from 'payload/shared'

import type { LoginFieldProps } from '../LoginField/index.js'

import { LoginField } from '../LoginField/index.js'
import './index.scss'

export const LoginForm: React.FC<{
  searchParams: { [key: string]: string | string[] | undefined }
}> = ({ searchParams }) => {
  const config = useConfig()

  const {
    admin: {
      autoLogin,
      routes: { forgot: forgotRoute },
      user: userSlug,
    },
    routes: { admin, api },
  } = config

  const collectionConfig = config.collections?.find((collection) => collection?.slug === userSlug)
  const { auth: authOptions } = collectionConfig
  const loginWithUsername = authOptions.loginWithUsername
  const canLoginWithEmail =
    !authOptions.loginWithUsername || authOptions.loginWithUsername.allowEmailLogin
  const canLoginWithUsername = authOptions.loginWithUsername

  const [loginType] = React.useState<LoginFieldProps['type']>(() => {
    if (canLoginWithEmail && canLoginWithUsername) return 'emailOrUsername'
    if (canLoginWithUsername) return 'username'
    return 'email'
  })

  const { t } = useTranslation()

  const prefillForm = autoLogin && autoLogin.prefillOnly

  const initialState: FormState = {
    password: {
      initialValue: prefillForm ? autoLogin.password : undefined,
      valid: true,
      value: prefillForm ? autoLogin.password : undefined,
    },
  }

  if (loginWithUsername) {
    initialState.username = {
      initialValue: prefillForm ? autoLogin.username : undefined,
      valid: true,
      value: prefillForm ? autoLogin.username : undefined,
    }
  } else {
    initialState.email = {
      initialValue: prefillForm ? autoLogin.email : undefined,
      valid: true,
      value: prefillForm ? autoLogin.email : undefined,
    }
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
      <div className={`${baseClass}__inputWrap`}>
        <LoginField type={loginType} />
        <PasswordField
          autoComplete="off"
          label={t('general:password')}
          name="password"
          required
          validate={(value) =>
            password(value, {
              name: 'password',
              type: 'text',
              data: {},
              preferences: { fields: {} },
              req: {
                payload: {
                  config,
                },
                t,
              } as PayloadRequest,
              required: true,
              siblingData: {},
            })
          }
        />
      </div>
      <Link href={`${admin}${forgotRoute}`}>{t('authentication:forgotPasswordQuestion')}</Link>
      <FormSubmit>{t('authentication:login')}</FormSubmit>
    </Form>
  )
}
