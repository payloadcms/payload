'use client'

import LinkImport from 'next/link.js'
import React from 'react'

const baseClass = 'login__form'
const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

import type { FormState, PayloadRequest } from 'payload'

import { Form, FormSubmit, PasswordField, useConfig, useTranslation } from '@payloadcms/ui'
import { formatAdminURL } from '@payloadcms/ui/shared'
import { password } from 'payload/shared'

import type { LoginFieldProps } from '../LoginField/index.js'

import { LoginField } from '../LoginField/index.js'
import './index.scss'

export const LoginForm: React.FC<{
  prefillEmail?: string
  prefillPassword?: string
  prefillUsername?: string
  searchParams: { [key: string]: string | string[] | undefined }
}> = ({ prefillEmail, prefillPassword, prefillUsername, searchParams }) => {
  const config = useConfig()

  const {
    admin: {
      routes: { forgot: forgotRoute },
      user: userSlug,
    },
    routes: { admin: adminRoute, api: apiRoute },
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

  const initialState: FormState = {
    password: {
      initialValue: prefillPassword ?? undefined,
      valid: true,
      value: prefillPassword ?? undefined,
    },
  }

  if (loginWithUsername) {
    initialState.username = {
      initialValue: prefillUsername ?? undefined,
      valid: true,
      value: prefillUsername ?? undefined,
    }
  } else {
    initialState.email = {
      initialValue: prefillEmail ?? undefined,
      valid: true,
      value: prefillEmail ?? undefined,
    }
  }

  return (
    <Form
      action={`${apiRoute}/${userSlug}/login`}
      className={baseClass}
      disableSuccessStatus
      initialState={initialState}
      method="POST"
      redirect={typeof searchParams?.redirect === 'string' ? searchParams.redirect : adminRoute}
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
      <Link
        href={formatAdminURL({
          adminRoute,
          path: forgotRoute,
        })}
      >
        {t('authentication:forgotPasswordQuestion')}
      </Link>
      <FormSubmit>{t('authentication:login')}</FormSubmit>
    </Form>
  )
}
