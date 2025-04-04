'use client'

import React from 'react'

const baseClass = 'login__form'

import type { UserWithToken } from '@payloadcms/ui'
import type { FormState } from 'payload'

import {
  Form,
  FormSubmit,
  Link,
  PasswordField,
  useAuth,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import { formatAdminURL, getLoginOptions } from 'payload/shared'

import type { LoginFieldProps } from '../LoginField/index.js'

import { getSafeRedirect } from '../../../utilities/getSafeRedirect.js'
import { LoginField } from '../LoginField/index.js'
import './index.scss'

export const LoginForm: React.FC<{
  prefillEmail?: string
  prefillPassword?: string
  prefillUsername?: string
  searchParams: { [key: string]: string | string[] | undefined }
}> = ({ prefillEmail, prefillPassword, prefillUsername, searchParams }) => {
  const { config, getEntityConfig } = useConfig()

  const {
    admin: {
      routes: { forgot: forgotRoute },
      user: userSlug,
    },
    routes: { admin: adminRoute, api: apiRoute },
  } = config

  const collectionConfig = getEntityConfig({ collectionSlug: userSlug })
  const { auth: authOptions } = collectionConfig
  const loginWithUsername = authOptions.loginWithUsername
  const { canLoginWithEmail, canLoginWithUsername } = getLoginOptions(loginWithUsername)

  const [loginType] = React.useState<LoginFieldProps['type']>(() => {
    if (canLoginWithEmail && canLoginWithUsername) {
      return 'emailOrUsername'
    }
    if (canLoginWithUsername) {
      return 'username'
    }
    return 'email'
  })

  const { t } = useTranslation()
  const { setUser } = useAuth()

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

  const handleLogin = (data: UserWithToken) => {
    setUser(data)
  }

  return (
    <Form
      action={`${apiRoute}/${userSlug}/login`}
      className={baseClass}
      disableSuccessStatus
      initialState={initialState}
      method="POST"
      onSuccess={handleLogin}
      redirect={getSafeRedirect(searchParams?.redirect, adminRoute)}
      waitForAutocomplete
    >
      <div className={`${baseClass}__inputWrap`}>
        <LoginField type={loginType} />
        <PasswordField
          field={{
            name: 'password',
            label: t('general:password'),
            required: true,
          }}
          path="password"
        />
      </div>
      <Link
        href={formatAdminURL({
          adminRoute,
          path: forgotRoute,
        })}
        prefetch={false}
      >
        {t('authentication:forgotPasswordQuestion')}
      </Link>
      <FormSubmit size="large">{t('authentication:login')}</FormSubmit>
    </Form>
  )
}
