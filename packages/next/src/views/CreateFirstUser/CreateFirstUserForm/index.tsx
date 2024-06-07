'use client'
import type { PayloadRequestWithData } from 'payload/types'

export const createFirstUserBaseClass = 'create-first-user__form'

import { ConfirmPassword } from '@payloadcms/ui/fields/ConfirmPassword'
import { Email } from '@payloadcms/ui/fields/Email'
import { Password } from '@payloadcms/ui/fields/Password'
import { Form } from '@payloadcms/ui/forms/Form'
import { RenderFields } from '@payloadcms/ui/forms/RenderFields'
import { FormSubmit } from '@payloadcms/ui/forms/Submit'
import { useComponentMap } from '@payloadcms/ui/providers/ComponentMap'
import { useConfig } from '@payloadcms/ui/providers/Config'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import { email, password } from 'payload/fields/validations'
import React from 'react'

import './index.scss'

export const CreateFirstUserForm: React.FC<{
  searchParams: { [key: string]: string | string[] | undefined }
}> = ({ searchParams }) => {
  const { t } = useTranslation()

  const config = useConfig()

  const { getFieldMap } = useComponentMap()

  const {
    admin: { user: userSlug },
    routes: { admin, api },
  } = config

  const fieldMap = getFieldMap({ collectionSlug: userSlug })

  return (
    <Form
      action={`${api}/${userSlug}/first-register`}
      method="POST"
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
          label={t('authentication:newPassword')}
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
