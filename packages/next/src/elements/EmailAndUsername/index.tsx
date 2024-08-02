'use client'

import { EmailField, TextField, useTranslation } from '@payloadcms/ui'
import { email, username } from 'payload/shared'
import React from 'react'

type Props = {
  requireEmail?: boolean
  requireUsername?: boolean
  showEmailField?: boolean
  showUsernameField?: boolean
}
export const EmailAndUsernameFields: React.FC<Props> = ({
  requireEmail = true,
  requireUsername = false,
  showEmailField = true,
  showUsernameField = true,
}) => {
  const { t } = useTranslation()

  return (
    <React.Fragment>
      {showEmailField && (
        <EmailField
          autoComplete="email"
          label={t('general:email')}
          name="email"
          path="email"
          required={requireEmail}
          validate={email}
        />
      )}

      {showUsernameField && (
        <TextField
          label={t('authentication:username')}
          name="username"
          path="username"
          required={requireUsername}
          validate={username}
        />
      )}
    </React.Fragment>
  )
}
