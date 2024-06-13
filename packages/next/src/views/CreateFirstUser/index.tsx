import type { AdminViewProps, Field } from 'payload'

import { buildStateFromSchema } from '@payloadcms/ui/forms/buildStateFromSchema'
import React from 'react'

import { CreateFirstUserClient } from './index.client.js'
import './index.scss'

export { generateCreateFirstUserMetadata } from './meta.js'

export const CreateFirstUserView: React.FC<AdminViewProps> = async ({ initPageResult }) => {
  const {
    req,
    req: {
      payload: {
        config: {
          admin: { user: userSlug },
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

  const formState = await buildStateFromSchema({
    fieldSchema: fields,
    operation: 'create',
    preferences: { fields: {} },
    req,
  })

  return (
    <div className="create-first-user">
      <h1>{req.t('general:welcome')}</h1>
      <p>{req.t('authentication:beginCreateFirstUser')}</p>
      <CreateFirstUserClient initialState={formState} userSlug={userSlug} />
    </div>
  )
}
