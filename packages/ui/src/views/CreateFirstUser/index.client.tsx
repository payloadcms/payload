'use client'
import type {
  DocumentPreferences,
  FormState,
  LoginWithUsernameOptions,
  SanitizedDocumentPermissions,
} from 'payload'

import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { FormStateRequest } from '../../forms/Form/types.js'
import type { UserWithToken } from '../../providers/Auth/index.js'

import { EmailAndUsernameFields } from '../../elements/EmailAndUsername/index.js'
import { ConfirmPasswordField } from '../../fields/ConfirmPassword/index.js'
import { PasswordField } from '../../fields/Password/index.js'
import { Form } from '../../forms/Form/index.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

const baseClass = 'create-first-user__form'

export const CreateFirstUserClient: React.FC<{
  docPermissions: SanitizedDocumentPermissions
  docPreferences: DocumentPreferences
  initialState: FormState
  loginWithUsername?: false | LoginWithUsernameOptions
  userSlug: string
}> = ({ docPermissions, docPreferences, initialState, loginWithUsername, userSlug }) => {
  const {
    config: {
      routes: { admin, api: apiRoute },
    },
    getEntityConfig,
  } = useConfig()

  const { t } = useTranslation()
  const { setUser } = useAuth()

  const collectionConfig = getEntityConfig({ collectionSlug: userSlug })

  const formStateRequest = React.useMemo<FormStateRequest>(
    () => ({
      args: {
        collectionSlug: userSlug,
        docPermissions,
        docPreferences,
        operation: 'create',
        schemaPath: userSlug,
      },
    }),
    [userSlug, docPermissions, docPreferences],
  )

  const handleFirstRegister = (data: UserWithToken) => {
    setUser(data)
  }

  return (
    <Form
      action={formatAdminURL({
        apiRoute,
        path: `/${userSlug}/first-register`,
      })}
      className={baseClass}
      formStateRequest={formStateRequest}
      initialState={{
        ...initialState,
        'confirm-password': {
          ...initialState['confirm-password'],
          valid: initialState['confirm-password']['valid'] || false,
          value: initialState['confirm-password']['value'] || '',
        },
      }}
      method="POST"
      onSuccess={handleFirstRegister}
      redirect={admin}
      validationOperation="create"
    >
      <div className={`${baseClass}__inputWrap`}>
        <EmailAndUsernameFields
          loginWithUsername={loginWithUsername}
          operation="create"
          readOnly={false}
          t={t}
        />
        <PasswordField
          autoComplete="off"
          field={{
            name: 'password',
            label: t('authentication:newPassword'),
            required: true,
          }}
          path="password"
        />
        <ConfirmPasswordField />
        <RenderFields
          fields={collectionConfig.fields}
          forceRender
          parentIndexPath=""
          parentPath=""
          parentSchemaPath={userSlug}
          permissions={true}
          readOnly={false}
        />
      </div>
      <div className={`${baseClass}__actions`}>
        <FormSubmit size="large">{t('authentication:createUser')}</FormSubmit>
      </div>
    </Form>
  )
}
