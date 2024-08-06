'use client'

import type { LoginWithUsernameOptions } from 'payload'

import { EmailField, TextField, useTranslation } from '@payloadcms/ui'
import { email, username } from 'payload/shared'
import React from 'react'

type Props = {
  loginWithUsername?: LoginWithUsernameOptions | false
}
export const EmailAndUsernameFields: React.FC<Props> = ({ loginWithUsername }) => {
  const { t } = useTranslation()

  const requireEmail = !loginWithUsername || (loginWithUsername && loginWithUsername.requireEmail)
  const requireUsername = loginWithUsername && loginWithUsername.requireUsername
  const showEmailField =
    !loginWithUsername || loginWithUsername?.requireEmail || loginWithUsername?.allowEmailLogin
  const showUsernameField = Boolean(loginWithUsername)

  return (
    <React.Fragment>
      {showEmailField && (
        <EmailField
          clientFieldConfig={{
            name: 'email',
            autoComplete: 'email',
            label: t('general:email'),
            path: 'email',
            requireEmail,
            required,
          }}
          validate={email}
        />
      )}

      {showUsernameField && (
        <TextField
          clientFieldConfig={{
            name: 'username',
            label: t('authentication:username'),
            path: 'username',
            required: requireUsername,
          }}
          validate={username}
        />
      )}
    </React.Fragment>
  )
}
