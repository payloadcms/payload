import type { FieldTypes } from 'payload/config'
import type { Field, WithServerSideProps as WithServerSidePropsType } from 'payload/types'
import type { AdminViewProps } from 'payload/types'

import { Form } from '@payloadcms/ui/forms/Form'
import { FormSubmit } from '@payloadcms/ui/forms/Submit'
import { buildStateFromSchema } from '@payloadcms/ui/forms/buildStateFromSchema'
import { WithServerSideProps as WithServerSidePropsGeneric } from '@payloadcms/ui/providers/ComponentMap'
import { mapFields } from '@payloadcms/ui/utilities/buildComponentMap'
import React from 'react'

import { CreateFirstUserFields } from './index.client.js'
import './index.scss'

export { generateCreateFirstUserMetadata } from './meta.js'

export const CreateFirstUserView: React.FC<AdminViewProps> = async ({ initPageResult }) => {
  const {
    req,
    req: {
      i18n,
      payload,
      payload: {
        config,
        config: {
          admin: { user: userSlug },
          routes: { admin: adminRoute, api: apiRoute },
          serverURL,
        },
      },
    },
  } = initPageResult

  const fields: Field[] = [
    {
      name: 'email',
      type: 'email',
      label: req.t('general:emailAddress'),
      required: true,
    },
    {
      name: 'password',
      type: 'text',
      label: req.t('general:password'),
      required: true,
    },
    {
      name: 'confirm-password',
      type: 'text',
      label: req.t('authentication:confirmPassword'),
      required: true,
    },
  ]

  const WithServerSideProps: WithServerSidePropsType = ({ Component, ...rest }) => {
    return <WithServerSidePropsGeneric Component={Component} payload={payload} {...rest} />
  }

  const createFirstUserFieldMap = mapFields({
    WithServerSideProps,
    config,
    fieldSchema: fields,
    i18n,
    parentPath: userSlug,
  }).map((field) => {
    // Transform field types for the password and confirm-password fields
    if (field.name === 'password') {
      const type: keyof FieldTypes = 'password'

      return {
        ...field,
        type,
      }
    }
    if (field.name === 'confirm-password') {
      const type: keyof FieldTypes = 'confirmPassword'

      return {
        ...field,
        type,
      }
    }
    return field
  })

  const formState = await buildStateFromSchema({
    fieldSchema: fields,
    operation: 'create',
    preferences: {},
    req,
  })

  return (
    <React.Fragment>
      <h1>{req.t('general:welcome')}</h1>
      <p>{req.t('authentication:beginCreateFirstUser')}</p>
      <Form
        action={`${serverURL}${apiRoute}/${userSlug}/first-register`}
        initialState={formState}
        method="POST"
        redirect={adminRoute}
        validationOperation="create"
      >
        <CreateFirstUserFields
          createFirstUserFieldMap={createFirstUserFieldMap}
          userSlug={userSlug}
        />
        <FormSubmit>{req.t('general:create')}</FormSubmit>
      </Form>
    </React.Fragment>
  )
}
