'use client'

import type { FieldPermissions, LoginWithUsernameOptions } from 'payload'

import { EmailField, RenderFields, TextField, useTranslation } from '@payloadcms/ui'
import { email, username } from 'payload/shared'
import React from 'react'

type Props = {
  readonly loginWithUsername?: LoginWithUsernameOptions | false
}
function EmailFieldComponent(props: Props) {
  const { loginWithUsername } = props
  const { t } = useTranslation()

  const requireEmail = !loginWithUsername || (loginWithUsername && loginWithUsername.requireEmail)
  const showEmailField =
    !loginWithUsername || loginWithUsername?.requireEmail || loginWithUsername?.allowEmailLogin

  if (showEmailField) {
    return (
      <EmailField
        autoComplete="off"
        field={{
          name: 'email',
          _path: 'email',
          label: t('general:email'),
          required: requireEmail,
        }}
        validate={email}
      />
    )
  }

  return null
}

function UsernameFieldComponent(props: Props) {
  const { loginWithUsername } = props
  const { t } = useTranslation()

  const requireUsername = loginWithUsername && loginWithUsername.requireUsername
  const showUsernameField = Boolean(loginWithUsername)

  if (showUsernameField) {
    return (
      <TextField
        field={{
          name: 'username',
          _path: 'username',
          label: t('authentication:username'),
          required: requireUsername,
        }}
        validate={username}
      />
    )
  }

  return null
}

type RenderEmailAndUsernameFieldsProps = {
  className?: string
  loginWithUsername?: LoginWithUsernameOptions | false
  operation?: 'create' | 'update'
  permissions?: {
    [fieldName: string]: FieldPermissions
  }
  readOnly: boolean
}
export function RenderEmailAndUsernameFields(props: RenderEmailAndUsernameFieldsProps) {
  const { className, loginWithUsername, operation, permissions, readOnly } = props

  // TODO: Fix this!
  return (
    <RenderFields
      className={className}
      fields={[
        {
          name: 'email',
          type: 'text',
          _fieldIsPresentational: false,
          _isFieldAffectingData: true,
          admin: {
            components: {
              Field: {
                type: 'client',
                Component: null,
                RenderedComponent: <EmailFieldComponent loginWithUsername={loginWithUsername} />,
              },
            },
          },
          localized: false,
        },
        {
          name: 'username',
          type: 'text',
          _fieldIsPresentational: false,
          _isFieldAffectingData: true,
          admin: {
            components: {
              Field: {
                type: 'client',
                Component: null,
                RenderedComponent: <UsernameFieldComponent loginWithUsername={loginWithUsername} />,
              },
            },
          },
          localized: false,
        },
      ]}
      forceRender
      operation={operation}
      path=""
      permissions={permissions}
      readOnly={readOnly}
      schemaPath=""
    />
  )
}
