'use client'

import type { FormState, PayloadRequest } from 'payload'

import { email, formatAdminURL, text } from 'payload/shared'
import React, { useState } from 'react'

import type { FormProps } from '../../../forms/Form/index.js'

import { FormHeader } from '../../../elements/FormHeader/index.js'
import { EmailField } from '../../../fields/Email/index.js'
import { TextField } from '../../../fields/Text/index.js'
import { Form } from '../../../forms/Form/index.js'
import { FormSubmit } from '../../../forms/Submit/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import './index.css'

const baseClass = 'forgot-password__form'

export const ForgotPasswordForm: React.FC = () => {
  const { config, getEntityConfig } = useConfig()

  const {
    admin: { user: userSlug },
    routes: { api: apiRoute },
  } = config

  const { t } = useTranslation()
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const collectionConfig = getEntityConfig({ collectionSlug: userSlug })
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
      action={formatAdminURL({
        apiRoute,
        path: `/${userSlug}/forgot-password`,
      })}
      className={baseClass}
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

      <div className={`${baseClass}__inputWrap`}>
        {loginWithUsername ? (
          <TextField
            field={{
              name: 'username',
              label: t('authentication:username'),
              required: true,
            }}
            path="username"
            validate={(value) =>
              text(value, {
                name: 'username',
                type: 'text',
                blockData: {},
                data: {},
                event: 'onChange',
                path: ['username'],
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
            field={{
              name: 'email',
              admin: {
                autoComplete: 'email',
              },
              label: t('general:email'),
              required: true,
            }}
            path="email"
            validate={(value) =>
              email(value, {
                name: 'email',
                type: 'email',
                blockData: {},
                data: {},
                event: 'onChange',
                path: ['email'],
                preferences: { fields: {} },
                req: { payload: { config }, t } as unknown as PayloadRequest,
                required: true,
                siblingData: {},
              })
            }
          />
        )}
      </div>
      <div className={`${baseClass}__actions`}>
        <FormSubmit size="large">{t('general:submit')}</FormSubmit>
      </div>
    </Form>
  )
}
