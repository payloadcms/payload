'use client'

import type { TFunction } from '@payloadcms/translations'
import type { LoginWithUsernameOptions, SanitizedFieldPermissions } from 'payload'

import { email, getFieldPermissions, username } from 'payload/shared'
import React from 'react'

import { EmailField } from '../../fields/Email/index.js'
import { TextField } from '../../fields/Text/index.js'
import './index.scss'
import { FieldPathContext } from '../../forms/RenderFields/context.js'

const baseClass = 'login-fields'
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
  const {
    className,
    loginWithUsername,
    operation: operationFromProps,
    permissions,
    readOnly,
    t,
  } = props

  function getAuthFieldPermission(fieldName: string, operation: 'read' | 'update') {
    const permissionsResult = getFieldPermissions({
      field: { name: fieldName, type: 'text' },
      operation: operationFromProps === 'create' ? 'create' : operation,
      parentName: '',
      permissions,
    })
    return permissionsResult.operation
  }

  const hasEmailFieldOverride =
    typeof permissions === 'object' && 'email' in permissions && permissions.email
  const hasUsernameFieldOverride =
    typeof permissions === 'object' && 'username' in permissions && permissions.username

  const emailPermissions = hasEmailFieldOverride
    ? {
        read: getAuthFieldPermission('email', 'read'),
        update: getAuthFieldPermission('email', 'update'),
      }
    : {
        read: true,
        update: true,
      }

  const usernamePermissions = hasUsernameFieldOverride
    ? {
        read: getAuthFieldPermission('username', 'read'),
        update: getAuthFieldPermission('username', 'update'),
      }
    : {
        read: true,
        update: true,
      }

  const showEmailField =
    (!loginWithUsername || loginWithUsername?.requireEmail || loginWithUsername?.allowEmailLogin) &&
    emailPermissions.read

  const showUsernameField = Boolean(loginWithUsername) && usernamePermissions.read

  if (showEmailField || showUsernameField) {
    return (
      <div className={[baseClass, className && className].filter(Boolean).join(' ')}>
        {showEmailField ? (
          <FieldPathContext value="email">
            <EmailField
              field={{
                name: 'email',
                admin: {
                  autoComplete: 'off',
                },
                label: t('general:email'),
                required:
                  !loginWithUsername || (loginWithUsername && loginWithUsername.requireEmail),
              }}
              path="email"
              readOnly={readOnly || !emailPermissions.update}
              schemaPath="email"
              validate={email}
            />
          </FieldPathContext>
        ) : null}
        {showUsernameField && (
          <FieldPathContext value="username">
            <TextField
              field={{
                name: 'username',
                admin: {
                  autoComplete: 'off',
                },
                label: t('authentication:username'),
                required: loginWithUsername && loginWithUsername.requireUsername,
              }}
              path="username"
              readOnly={readOnly || !usernamePermissions.update}
              schemaPath="username"
              validate={username}
            />
          </FieldPathContext>
        )}
      </div>
    )
  }
}
