import { EmailField, TextField, useConfig, useTranslation } from '@payloadcms/ui'
import { email, username } from 'payload/shared'
import React from 'react'

type Props = {
  requireEmail?: boolean
  requireUsername?: boolean
  showEmailField?: boolean
  showUsernameField?: boolean
  userSlug: string
}
export const EmailAndUsernameFields: React.FC<Props> = ({
  requireEmail = true,
  requireUsername = false,
  showEmailField = true,
  showUsernameField = true,
  userSlug,
}) => {
  const config = useConfig()
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
          validate={(value, options) => {
            return email(value, {
              ...options,
              collectionSlug: userSlug,
              req: { payload: { config }, t } as any,
            } as any)
          }}
        />
      )}

      {showUsernameField && (
        <TextField
          label={t('authentication:username')}
          name="username"
          path="username"
          required={requireUsername}
          validate={(value, options) => {
            console.log({ options })
            return username(value, {
              ...options,
              collectionSlug: userSlug,
              req: {
                payload: {
                  config,
                },
                t,
              } as any,
            } as any)
          }}
        />
      )}
    </React.Fragment>
  )
}
