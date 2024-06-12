'use client'

import type { FormProps } from '@payloadcms/ui/forms/Form'
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

import './index.scss'

export const createFirstUserBaseClass = 'create-first-user__form'

export const CreateFirstUserForm: React.FC<{
  initialState: FormState
  searchParams: { [key: string]: string | string[] | undefined }
}> = ({ initialState, searchParams }) => {
  const { t } = useTranslation()

  const config = useConfig()

  const { getFieldMap } = useComponentMap()

  const {
    admin: { user: userSlug },
    routes: { admin, api },
    serverURL,
  } = config

  const fieldMap = getFieldMap({ collectionSlug: userSlug })

  const onChange: FormProps['onChange'][0] = React.useCallback(
    async ({ formState: prevFormState }) => {
      return getFormState({
        apiRoute: api,
        body: {
          collectionSlug: userSlug,
          formState: prevFormState,
          operation: 'create',
          schemaPath: userSlug,
        },
        serverURL,
      })
    },
    [api, userSlug, serverURL],
  )

  return (
    <Form
      action={`${api}/${userSlug}/first-register`}
      initialState={initialState}
      method="POST"
      onChange={[onChange]}
      redirect={typeof searchParams?.redirect === 'string' ? searchParams.redirect : admin}
      validationOperation="create"
    >
      <fieldset className={`${createFirstUserBaseClass}__inputWrap`}>
        <legend>
          <h1>{t('general:welcome')}</h1>
          <p>{t('authentication:beginCreateFirstUser')}</p>
        </legend>

        <Email autoComplete="email" label={t('general:email')} name="email" required />
        <Password autoComplete="off" label={t('general:password')} name="password" required />
        <ConfirmPassword />
        <RenderFields
          fieldMap={fieldMap}
          operation="create"
          path=""
          readOnly={false}
          schemaPath={userSlug}
        />
      </fieldset>
      <FormSubmit>{t('general:create')}</FormSubmit>
    </Form>
  )
}
