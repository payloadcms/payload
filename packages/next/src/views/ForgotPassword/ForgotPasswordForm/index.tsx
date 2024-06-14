'use client'

import type { FormProps } from '@payloadcms/ui/client'
import type { FormState, PayloadRequestWithData } from 'payload'

import { EmailField, Form, FormSubmit, useConfig, useTranslation } from '@payloadcms/ui/client'
import { email } from 'payload/shared'
import React, { Fragment, useState } from 'react'

export const ForgotPasswordForm: React.FC = () => {
  const config = useConfig()

  const {
    admin: { user: userSlug },
    routes: { api },
  } = config

  const { t } = useTranslation()
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const handleResponse: FormProps['handleResponse'] = (res, successToast, errorToast) => {
    res
      .json()
      .then(() => {
        setHasSubmitted(true)
        successToast(t('general:submissionSuccessful'))
      })
      .catch(() => {
        errorToast(t('authentication:emailNotValid'))
      })
  }

  const initialState: FormState = {
    email: {
      initialValue: '',
      valid: true,
      value: undefined,
    },
  }

  if (hasSubmitted) {
    return (
      <Fragment>
        <h1>{t('authentication:emailSent')}</h1>
        <p>{t('authentication:checkYourEmailForPasswordReset')}</p>
      </Fragment>
    )
  }

  return (
    <Form
      action={`${api}/${userSlug}/forgot-password`}
      handleResponse={handleResponse}
      initialState={initialState}
      method="POST"
    >
      <h1>{t('authentication:forgotPassword')}</h1>
      <p>{t('authentication:forgotPasswordEmailInstructions')}</p>
      <EmailField
        autoComplete="email"
        label={t('general:email')}
        name="email"
        required
        validate={(value) =>
          email(value, {
            name: 'email',
            type: 'email',
            data: {},
            preferences: { fields: {} },
            req: { t } as PayloadRequestWithData,
            required: true,
            siblingData: {},
          })
        }
      />
      <FormSubmit>{t('general:submit')}</FormSubmit>
    </Form>
  )
}
