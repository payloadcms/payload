'use client'
import type {
  ClientCollectionConfig,
  ClientUser,
  FormState,
  LoginWithUsernameOptions,
} from 'payload'

import {
  ConfirmPasswordField,
  EmailAndUsernameFields,
  Form,
  type FormProps,
  FormSubmit,
  PasswordField,
  useAuth,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import { getFormState } from '@payloadcms/ui/shared'
import React from 'react'

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

  const { t } = useTranslation()
  const { setUser } = useAuth()

  const collectionConfig = getEntityConfig({ collectionSlug: userSlug }) as ClientCollectionConfig

  const onChange: FormProps['onChange'][0] = React.useCallback(
    async ({ formState: prevFormState }) => {
      const { state } = await getFormState({
        apiRoute,
        body: {
          collectionSlug: userSlug,
          formState: prevFormState,
          operation: 'create',
          schemaPath: `_${userSlug}.auth`,
        },
        serverURL,
      })
      return state
    },
    [apiRoute, userSlug, serverURL],
  )

  const handleFirstRegister = (data: { user: ClientUser }) => {
    setUser(data.user)
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
      <EmailAndUsernameFields
        className="emailAndUsername"
        loginWithUsername={loginWithUsername}
        operation="create"
        readOnly={false}
        t={t}
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
      {/* <RenderFields
        fields={collectionConfig.fields}
        forceRender
        operation="create"
        path=""
        readOnly={false}
        schemaPath={userSlug}
      /> */}
      <FormSubmit size="large">{t('general:create')}</FormSubmit>
    </Form>
  )
}
