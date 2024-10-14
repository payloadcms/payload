'use client'

import type { FormProps } from '@payloadcms/ui'
import type { FormState, PayloadRequest } from 'payload'

import { EmailField, Form, FormSubmit, TextField, useConfig, useTranslation } from '@payloadcms/ui'
import { email, text } from 'payload/shared'
import React, { useState } from 'react'

import { FormHeader } from '../../../elements/FormHeader/index.js'

export const ForgotPasswordForm: React.FC = () => {
  const { config } = useConfig()

  const {
    admin: { user: userSlug },
    routes: { api },
  } = config

  const { t } = useTranslation()
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const collectionConfig = config.collections?.find((collection) => collection?.slug === userSlug)
  const loginWithUsername = collectionConfig?.auth?.loginWithUsername

  const handleResponse: FormProps['handleResponse'] = (res, successToast, errorToast) => {
    res
      .json()
      .then(() => {
        setHasSubmitted(true)
        successToast(t('general:submissionSuccessful'))
      })
      .catch(() => {
        errorToast(
          loginWithUsername
            ? t('authentication:usernameNotValid')
            : t('authentication:emailNotValid'),
        )
      })
  }

  const initialState: FormState = loginWithUsername
    ? {
        username: {
          initialValue: '',
          valid: true,
          value: undefined,
        },
      }
    : {
        email: {
          initialValue: '',
          valid: true,
          value: undefined,
        },
      }

  if (hasSubmitted) {
    return (
      <FormHeader
        description={t('authentication:checkYourEmailForPasswordReset')}
        heading={t('authentication:emailSent')}
      />
    )
  }

  return (
    <Form
      action={`${api}/${userSlug}/forgot-password`}
      handleResponse={handleResponse}
      initialState={initialState}
      method="POST"
    >
      <FormHeader
        description={
          loginWithUsername
            ? t('authentication:forgotPasswordUsernameInstructions')
            : t('authentication:forgotPasswordEmailInstructions')
        }
        heading={t('authentication:forgotPassword')}
      />

      {loginWithUsername ? (
        <TextField
          field={{
            name: 'username',
            label: t('authentication:username'),
            required: true,
          }}
          validate={(value) =>
            text(value, {
              name: 'username',
              type: 'text',
              data: {},
              preferences: { fields: {} },
              req: {
                payload: {
                  config,
                },
                t,
              } as unknown as PayloadRequest,
              required: true,
              siblingData: {},
            })
          }
        />
      ) : (
        <EmailField
          autoComplete="email"
          field={{
            name: 'email',
            label: t('general:email'),
            required: true,
          }}
          validate={(value) =>
            email(value, {
              name: 'email',
              type: 'email',
              data: {},
              preferences: { fields: {} },
              req: { payload: { config }, t } as unknown as PayloadRequest,
              required: true,
              siblingData: {},
            })
          }
        />
      )}
      <FormSubmit size="large">{t('general:submit')}</FormSubmit>
    </Form>
  )
}