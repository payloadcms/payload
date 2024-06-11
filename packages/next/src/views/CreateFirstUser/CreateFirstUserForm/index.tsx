'use client'

import type { FormProps } from '@payloadcms/ui/forms/Form'
import type { Field, FormState, PayloadRequestWithData } from 'payload/types'

export const createFirstUserBaseClass = 'create-first-user__form'

import { ConfirmPassword } from '@payloadcms/ui/fields/ConfirmPassword'
import { Email } from '@payloadcms/ui/fields/Email'
import { Password } from '@payloadcms/ui/fields/Password'
import { Form } from '@payloadcms/ui/forms/Form'
import { RenderFields } from '@payloadcms/ui/forms/RenderFields'
import { FormSubmit } from '@payloadcms/ui/forms/Submit'
import { buildStateFromSchema } from '@payloadcms/ui/forms/buildStateFromSchema'
import { useComponentMap } from '@payloadcms/ui/providers/ComponentMap'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import { getFormState } from '@payloadcms/ui/utilities/getFormState'
import { email, password } from 'payload/fields/validations'
import React from 'react'

import './index.scss'

export const CreateFirstUserForm: React.FC<{
  req: PayloadRequestWithData
  searchParams: { [key: string]: string | string[] | undefined }
}> = async ({ req, searchParams }) => {
  const { t } = useTranslation()

  const config = useConfig()

  const { getFieldMap } = useComponentMap()

  const {
    admin: { user: userSlug },
    routes: { admin, api },
    serverURL,
  } = config

  const fieldMap = getFieldMap({ collectionSlug: userSlug })

  const fields: Field[] = [
    {
      name: 'email',
      type: 'email',
      label: t('general:email'),
      required: true,
    },
    {
      name: 'password',
      type: 'text',
      label: t('general:password'),
      required: true,
    },
    {
      name: 'confirm-password',
      type: 'text',
      label: t('authentication:confirmPassword'),
      required: true,
    },
  ]

  const initialState: FormState = await buildStateFromSchema({
    fieldSchema: fields,
    operation: 'create',
    preferences: { fields: {} },
    req,
  })

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
      <div className={`${createFirstUserBaseClass}__inputWrap`}>
        <div>
          <h1>{t('general:welcome')}</h1>
          <p>{t('authentication:beginCreateFirstUser')}</p>
        </div>

        <Email
          autoComplete="email"
          label={t('general:email')}
          name="email"
          required
          validate={(value) =>
            email(value, {
              name: 'email',
              type: 'email',
              data: {},
              preferences: { fields: {} },
              req: { t } as PayloadRequestWithData,
              required: true,
              siblingData: {},
            })
          }
        />
        <Password
          autoComplete="off"
          label={t('general:password')}
          name="password"
          required
          validate={(value) =>
            password(value, {
              name: 'password',
              type: 'text',
              data: {},
              preferences: { fields: {} },
              req: {
                payload: {
                  config,
                },
                t,
              } as PayloadRequestWithData,
              required: true,
              siblingData: {},
            })
          }
        />
        <ConfirmPassword />
        <RenderFields
          fieldMap={fieldMap}
          operation="create"
          path=""
          readOnly={false}
          schemaPath={userSlug}
        />
      </div>
      <FormSubmit>{t('general:create')}</FormSubmit>
    </Form>
  )
}
