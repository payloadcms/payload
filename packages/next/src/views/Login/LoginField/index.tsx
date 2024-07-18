'use client'
import type { PayloadRequest } from 'payload'

import { EmailField, TextField, useConfig, useTranslation } from '@payloadcms/ui'
import { email, username } from 'payload/shared'
import React from 'react'
export type LoginFieldProps = {
  type: 'email' | 'emailOrUsername' | 'username'
}
export const LoginField: React.FC<LoginFieldProps> = ({ type }) => {
  const { t } = useTranslation()
  const config = useConfig()

  if (type === 'email') {
    return (
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
            req: { t } as PayloadRequest,
            required: true,
            siblingData: {},
          })
        }
      />
    )
  }

  if (type === 'username') {
    return (
      <TextField
        label={t('authentication:username')}
        name="username"
        required
        validate={(value) =>
          username(value, {
            name: 'username',
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
    )
  }

  if (type === 'emailOrUsername') {
    return (
      <TextField
        label={t('authentication:emailOrUsername')}
        name="username"
        required
        validate={(value) => {
          const passesUsername = username(value, {
            name: 'username',
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
          const passesEmail = email(value, {
            name: 'username',
            type: 'email',
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

          if (!passesEmail && !passesUsername) {
            return `${t('general:email')}: ${passesEmail} ${t('general:username')}: ${passesUsername}`
          }

          return true
        }}
      />
    )
  }

  return null
}
