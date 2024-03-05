import type { Field } from 'payload/types'

import { Form, FormSubmit, buildStateFromSchema, mapFields } from '@payloadcms/ui'
import React from 'react'

import type { AdminViewProps } from '../Root'

import { CreateFirstUserFields } from './index.client'
import './index.scss'

export { generateCreateFirstUserMetadata } from './meta'

export const CreateFirstUser: React.FC<AdminViewProps> = async ({ initPageResult }) => {
  const {
    req,
    req: {
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

  const createFirstUserFieldMap = mapFields({
    fieldSchema: fields,
    config,
    parentPath: userSlug,
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
          userSlug={userSlug}
          createFirstUserFieldMap={createFirstUserFieldMap}
        />
        <FormSubmit>{req.t('general:create')}</FormSubmit>
      </Form>
    </React.Fragment>
  )
}
