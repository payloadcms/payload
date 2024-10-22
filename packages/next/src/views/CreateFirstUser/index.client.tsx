'use client'
import type { FormProps, UserWithToken } from '@payloadcms/ui'
import type { ClientCollectionConfig, FormState, LoginWithUsernameOptions } from 'payload'

import {
  ConfirmPasswordField,
  Form,
  FormSubmit,
  PasswordField,
  RenderFields,
  useAuth,
  useConfig,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import React from 'react'

import { RenderEmailAndUsernameFields } from '../../elements/EmailAndUsername/index.js'

export const CreateFirstUserClient: React.FC<{
  initialState: FormState
  loginWithUsername?: false | LoginWithUsernameOptions
  userSlug: string
}> = ({ initialState, loginWithUsername, userSlug }) => {
  const {
    config: {
      routes: { admin, api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const { getFormState } = useServerFunctions()

  const { t } = useTranslation()
  const { setUser } = useAuth()

  const collectionConfig = getEntityConfig({ collectionSlug: userSlug }) as ClientCollectionConfig

  const onChange: FormProps['onChange'][0] = React.useCallback(
    async ({ formState: prevFormState }) => {
      const { state } = await getFormState({
        collectionSlug: userSlug,
        formState: prevFormState,
        operation: 'create',
        schemaPath: `_${userSlug}.auth`,
      })

      return state
    },
    [userSlug, getFormState],
  )

  const handleFirstRegister = (data: UserWithToken) => {
    setUser(data)
  }

  return (
    <Form
      action={`${serverURL}${apiRoute}/${userSlug}/first-register`}
      initialState={initialState}
      method="POST"
      onChange={[onChange]}
      onSuccess={handleFirstRegister}
      redirect={admin}
      validationOperation="create"
    >
      <RenderEmailAndUsernameFields
        className="emailAndUsername"
        loginWithUsername={loginWithUsername}
        operation="create"
        readOnly={false}
      />
      <PasswordField
        autoComplete={'off'}
        field={{
          name: 'password',
          label: t('authentication:newPassword'),
          required: true,
        }}
      />
      <ConfirmPasswordField />
      <RenderFields
        fields={collectionConfig.fields}
        forceRender
        operation="create"
        path=""
        readOnly={false}
        schemaPath={userSlug}
      />
      <FormSubmit size="large">{t('general:create')}</FormSubmit>
    </Form>
  )
}
