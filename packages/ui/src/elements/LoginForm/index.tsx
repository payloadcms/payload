import React from 'react'

import { FormLoadingOverlayToggle } from '../../elements/Loading'
import Form from '../../forms/Form'
import FormSubmit from '../../forms/Submit'
import { Email } from '../../forms/field-types/Email'
import { Password } from '../../forms/field-types/Password'
import './index.scss'
import Link from 'next/link'
import { SanitizedConfig } from 'payload/types'

const baseClass = 'login-form'

export const LoginForm: React.FC<{
  action?: (formData: FormData) => Promise<void> | string
  config: SanitizedConfig
  searchParams: { [key: string]: string | string[] | undefined }
}> = async ({ config, searchParams }) => {
  const {
    admin: { autoLogin, user: userSlug },
    routes: { admin, api },
  } = config

  const prefillForm = autoLogin && autoLogin.prefillOnly

  return (
    <Form
      action={`${api}/${userSlug}/login`}
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
      redirect={`${admin}${searchParams?.redirect || ''}`}
      waitForAutocomplete
    >
      <FormLoadingOverlayToggle action="loading" name="login-form" />
      <div className={`${baseClass}__inputWrap`}>
        <Email
          admin={{ autoComplete: 'email' }}
          // label={t('general:email')}
          name="email"
          required
        />
        <Password
          autoComplete="off"
          // label={t('general:password')}
          name="password"
          required
        />
      </div>
      <Link href={`${admin}/forgot`}>
        Forgot Password
        {/* {t('forgotPasswordQuestion')} */}
      </Link>
      <FormSubmit>
        Login
        {/* {t('login')} */}
      </FormSubmit>
    </Form>
  )
}
