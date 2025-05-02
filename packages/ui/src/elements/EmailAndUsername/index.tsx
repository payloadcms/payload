'use client'

import type { TFunction } from '@payloadcms/translations'
import type { LoginWithUsernameOptions, SanitizedFieldPermissions } from 'payload'

import { email, username } from 'payload/shared'
import React from 'react'

import { EmailField } from '../../fields/Email/index.js'
import { TextField } from '../../fields/Text/index.js'

type RenderEmailAndUsernameFieldsProps = {
  className?: string
  loginWithUsername?: false | LoginWithUsernameOptions
  operation?: 'create' | 'update'
  permissions?:
    | {
        [fieldName: string]: SanitizedFieldPermissions
      }
    | true
  readOnly: boolean
  t: TFunction
}

export function EmailAndUsernameFields(props: RenderEmailAndUsernameFieldsProps) {
  const { className, loginWithUsername, readOnly, t } = props

  const showEmailField =
    !loginWithUsername || loginWithUsername?.requireEmail || loginWithUsername?.allowEmailLogin

  const showUsernameField = Boolean(loginWithUsername)

  return (
    <div className={className}>
      {showEmailField ? (
        <EmailField
          field={{
            name: 'email',
            admin: {
              autoComplete: 'off',
            },
            label: t('general:email'),
            required: !loginWithUsername || (loginWithUsername && loginWithUsername.requireEmail),
          }}
          path="email"
          readOnly={readOnly}
          schemaPath="email"
          validate={email}
        />
      ) : null}
      {showUsernameField && (
        <TextField
          field={{
            name: 'username',
            label: t('authentication:username'),
            required: loginWithUsername && loginWithUsername.requireUsername,
          }}
          path="username"
          readOnly={readOnly}
          schemaPath="username"
          validate={username}
        />
      )}
    </div>
  )
}
