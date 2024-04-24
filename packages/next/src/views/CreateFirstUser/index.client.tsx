'use client'
import type { FormProps } from '@payloadcms/ui/forms/Form'
import type { FieldMap } from '@payloadcms/ui/utilities/buildComponentMap'
import type { FormState } from 'payload/types'

import { ConfirmPassword } from '@payloadcms/ui/fields/ConfirmPassword'
import { Email } from '@payloadcms/ui/fields/Email'
import { Password } from '@payloadcms/ui/fields/Password'
import { Form } from '@payloadcms/ui/forms/Form'
import { RenderFields } from '@payloadcms/ui/forms/RenderFields'
import { FormSubmit } from '@payloadcms/ui/forms/Submit'
import { useComponentMap } from '@payloadcms/ui/providers/ComponentMap'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import { getFormState } from '@payloadcms/ui/utilities/getFormState'
import React from 'react'

export const CreateFirstUserClient: React.FC<{
  initialState: FormState
  userSlug: string
}> = ({ initialState, userSlug }) => {
  const { getFieldMap } = useComponentMap()

  const {
    routes: { admin, api: apiRoute },
    serverURL,
  } = useConfig()

  const { t } = useTranslation()

  const fieldMap = getFieldMap({ collectionSlug: userSlug })

  const onChange: FormProps['onChange'][0] = React.useCallback(
    async ({ formState: prevFormState }) => {
      return getFormState({
        apiRoute,
        body: {
          collectionSlug: userSlug,
          formState: prevFormState,
          operation: 'create',
          schemaPath: userSlug,
        },
        serverURL,
      })
    },
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
      <Email autoComplete="email" label={t('general:email')} name="email" required />
      <Password
        autoComplete="off"
        label={t('authentication:newPassword')}
        name="password"
        required
      />
      <ConfirmPassword />
      <RenderFields
        fieldMap={fieldMap}
        operation="create"
        path=""
        readOnly={false}
        schemaPath={userSlug}
      />
      <FormSubmit>{t('general:create')}</FormSubmit>
    </Form>
  )
}
