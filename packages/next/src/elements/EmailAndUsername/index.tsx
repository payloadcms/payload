'use client'

import type { FieldPermissions, LoginWithUsernameOptions } from 'payload'

import { EmailField, RenderFields, TextField, useTranslation } from '@payloadcms/ui'
import { email, username } from 'payload/shared'
import React from 'react'

type Props = {
  loginWithUsername?: LoginWithUsernameOptions | false
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
        label={t('general:email')}
        name="email"
        path="email"
        required={requireEmail}
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
        label={t('authentication:username')}
        name="username"
        path="username"
        required={requireUsername}
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

  return (
    <RenderFields
      className={className}
      fieldMap={[
        {
          name: 'email',
          type: 'text',
          CustomField: <EmailFieldComponent loginWithUsername={loginWithUsername} />,
          cellComponentProps: null,
          fieldComponentProps: { type: 'email', readOnly },
          fieldIsPresentational: false,
          isFieldAffectingData: true,
          localized: false,
        },
        {
          name: 'username',
          type: 'text',
          CustomField: <UsernameFieldComponent loginWithUsername={loginWithUsername} />,
          cellComponentProps: null,
          fieldComponentProps: { type: 'text', readOnly },
          fieldIsPresentational: false,
          isFieldAffectingData: true,
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
