'use client'
import type { ClientCollectionConfig, FormState } from 'payload'

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
import React, { useMemo } from 'react'

import { LoginField } from '../Login/LoginField/index.js'

export const CreateFirstUserClient: React.FC<{
  readonly initialState: FormState
  readonly loginType: 'email' | 'emailOrUsername' | 'username'
  readonly requireEmail?: boolean
  readonly userSlug: string
}> = ({ initialState, loginType, requireEmail: requireEmailFromProps = true, userSlug }) => {
  const {
    config: {
      routes: { admin, api: apiRoute },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const { t } = useTranslation()

  const collectionConfig = getEntityConfig({ collectionSlug: userSlug }) as ClientCollectionConfig

  const requireEmail = useMemo(() => {
    if (loginType === 'email') {
      return true
    }

    return requireEmailFromProps
  }, [loginType, requireEmailFromProps])

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
      {['emailOrUsername', 'username'].includes(loginType) && <LoginField type="username" />}
      {['email', 'emailOrUsername'].includes(loginType) && (
        <LoginField required={requireEmail} type="email" />
      )}
      <PasswordField
        clientFieldConfig={{
          name: 'password',
          _path: 'password',
          label: t('authentication:newPassword'),
          required: true,
        }}
        labelProps={{ htmlFor: 'field-password' }}
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
      <FormSubmit>{t('general:create')}</FormSubmit>
    </Form>
  )
}
