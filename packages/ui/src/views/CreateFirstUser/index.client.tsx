'use client'
import type {
  DocumentPreferences,
  FormState,
  LoginWithUsernameOptions,
  SanitizedDocumentPermissions,
} from 'payload'

import { formatAdminURL } from 'payload/shared'
import React, { useEffect } from 'react'

import type { FormProps } from '../../forms/Form/index.js'
import type { UserWithToken } from '../../providers/Auth/index.js'

import { EmailAndUsernameFields } from '../../elements/EmailAndUsername/index.js'
import { ConfirmPasswordField } from '../../fields/ConfirmPassword/index.js'
import { PasswordField } from '../../fields/Password/index.js'
import { Form } from '../../forms/Form/index.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js'

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

  const { getFormState } = useServerFunctions()

  const { t } = useTranslation()
  const { setUser } = useAuth()

  const abortOnChangeRef = React.useRef<AbortController>(null)

  const collectionConfig = getEntityConfig({ collectionSlug: userSlug })

  const onChange: FormProps['onChange'][0] = React.useCallback(
    async ({ formState: prevFormState, submitted }) => {
      const controller = handleAbortRef(abortOnChangeRef)

      const response = await getFormState({
        collectionSlug: userSlug,
        docPermissions,
        docPreferences,
        formState: prevFormState,
        operation: 'create',
        schemaPath: userSlug,
        signal: controller.signal,
        skipValidation: !submitted,
      })

      abortOnChangeRef.current = null

      if (response && response.state) {
        return response.state
      }
    },
    [userSlug, getFormState, docPermissions, docPreferences],
  )

  const handleFirstRegister = (data: UserWithToken) => {
    setUser(data)
  }

  useEffect(() => {
    const abortOnChange = abortOnChangeRef.current

    return () => {
      abortAndIgnore(abortOnChange)
    }
  }, [])

  return (
    <Form
      action={formatAdminURL({
        apiRoute,
        path: `/${userSlug}/first-register`,
      })}
      className={baseClass}
      initialState={{
        ...initialState,
        'confirm-password': {
          ...initialState['confirm-password'],
          valid: initialState['confirm-password']['valid'] || false,
          value: initialState['confirm-password']['value'] || '',
        },
      }}
      method="POST"
      onChange={[onChange]}
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
