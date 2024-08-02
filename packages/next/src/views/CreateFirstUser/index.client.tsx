'use client'
import type { FormState } from 'payload'

import {
  ConfirmPasswordField,
  Form,
  type FormProps,
  FormSubmit,
  PasswordField,
  RenderFields,
  useComponentMap,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import { getFormState } from '@payloadcms/ui/shared'
import React, { useMemo } from 'react'

import { LoginField } from '../Login/LoginField/index.js'

export const CreateFirstUserClient: React.FC<{
  initialState: FormState
  loginType: 'email' | 'emailOrUsername' | 'username'
  requireEmail?: boolean
  userSlug: string
}> = ({ initialState, loginType, requireEmail: requireEmailFromProps = true, userSlug }) => {
  const { getFieldMap } = useComponentMap()

  const {
    config: {
      routes: { admin, api: apiRoute },
      serverURL,
    },
  } = useConfig()

  const { t } = useTranslation()

  const fieldMap = getFieldMap({ collectionSlug: userSlug })

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
        label={t('authentication:newPassword')}
        labelProps={{ htmlFor: 'field-password' }}
        name="password"
        path="password"
        required
      />
      <ConfirmPasswordField />
      <RenderFields
        fieldMap={fieldMap}
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
