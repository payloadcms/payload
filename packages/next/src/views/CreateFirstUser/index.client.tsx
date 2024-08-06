'use client'
import type { ClientCollectionConfig, FormState, LoginWithUsernameOptions } from 'payload'

import {
  ConfirmPasswordField,
  Form,
  type FormProps,
  FormSubmit,
  PasswordField,
  RenderFields,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import { getFormState } from '@payloadcms/ui/shared'
import React from 'react'

import { EmailAndUsernameFields } from '../../elements/EmailAndUsername/index.js'

export const CreateFirstUserClient: React.FC<{
  initialState: FormState
  loginWithUsername?: LoginWithUsernameOptions | false
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

  const collectionConfig = getEntityConfig({ collectionSlug: userSlug }) as ClientCollectionConfig

  const onChange: FormProps['onChange'][0] = React.useCallback(
    async ({ formState: prevFormState }) =>
      getFormState({
        apiRoute,
        body: {
          collectionSlug: userSlug,
          formState: prevFormState,
          operation: 'create',
          schemaPath: `_${userSlug}.auth`,
        },
        serverURL,
      }),
    [apiRoute, userSlug, serverURL],
  )

  return (
    <Form
      action={`${serverURL}${apiRoute}/${userSlug}/first-register`}
      initialState={initialState}
      method="POST"
      onChange={[onChange]}
      redirect={admin}
      validationOperation="create"
    >
      <EmailAndUsernameFields loginWithUsername={loginWithUsername} />
      <PasswordField
        clientFieldConfig={{
          name: 'password',
          label: t('authentication:newPassword'),
          path: 'password',
        }}
        required
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
