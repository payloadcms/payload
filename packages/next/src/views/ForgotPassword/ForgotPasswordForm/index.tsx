'use client'

import type { FormProps } from '@payloadcms/ui/forms/Form'
import type { FormState, PayloadRequestWithData } from 'payload/types'

import { Email } from '@payloadcms/ui/fields/Email'
import { Form } from '@payloadcms/ui/forms/Form'
import { FormSubmit } from '@payloadcms/ui/forms/Submit'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import { email } from 'payload/fields/validations'
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
      <Email
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
