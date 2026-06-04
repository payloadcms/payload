'use client'

import type { FormState } from 'payload'

import { formatAdminURL, getLoginOptions, getSafeRedirect } from 'payload/shared'
import React from 'react'

import type { UserWithToken } from '../../../providers/Auth/index.js'
import type { LoginFieldProps } from '../LoginField/index.js'

import { PasswordField } from '../../../fields/Password/index.js'
import { Form } from '../../../forms/Form/index.js'
import { FormSubmit } from '../../../forms/Submit/index.js'
import { useAuth } from '../../../providers/Auth/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { PayloadLink } from '../../../providers/RouterAdapter/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { LoginField } from '../LoginField/index.js'
import './index.css'

const baseClass = 'login__form'

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
      action={formatAdminURL({
        apiRoute,
        path: `/${userSlug}/login`,
      })}
      className={baseClass}
      disableSuccessStatus
      initialState={initialState}
      method="POST"
      onSuccess={handleLogin}
      redirect={getSafeRedirect({ fallbackTo: adminRoute, redirectTo: searchParams?.redirect })}
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
      <div className={`${baseClass}__actions`}>
        <FormSubmit size="large">{t('authentication:login')}</FormSubmit>
        <div className={`${baseClass}__forgotPassword`}>
          <PayloadLink
            href={formatAdminURL({
              adminRoute,
              path: forgotRoute,
            })}
            prefetch={false}
          >
            {t('authentication:forgotPasswordQuestion')}
          </PayloadLink>
        </div>
      </div>
    </Form>
  )
}
