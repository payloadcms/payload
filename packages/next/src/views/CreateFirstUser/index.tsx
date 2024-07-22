import type { AdminViewProps } from 'payload'

import { buildStateFromSchema } from '@payloadcms/ui/forms/buildStateFromSchema'
import React, { useState } from 'react'

import type { LoginFieldProps } from '../Login/LoginField/index.js'

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
        config,
      },
    },
  } = initPageResult

  const collectionConfig = config.collections?.find((collection) => collection?.slug === userSlug)
  const { auth: authOptions } = collectionConfig
  const loginWithUsername = authOptions.loginWithUsername
  const loginWithEmail = !loginWithUsername || loginWithUsername.allowEmailLogin
  const emailRequired = loginWithUsername && loginWithUsername.requireEmail

  let loginType = 'email' as LoginFieldProps['type']

  const emailField = {
    name: 'email',
    type: 'email',
    label: req.t('general:emailAddress'),
    required: emailRequired ? true : false,
  }

  const usernameField = {
    name: 'username',
    type: 'text',
    label: req.t('authentication:username'),
    required: true,
  }

  const fields = []

  if (loginWithUsername) {
    fields.push(usernameField)
    if (emailRequired || loginWithEmail) {
      fields.push(emailField)
    }
    loginType = 'username'
  } else {
    fields.push(emailField)
    loginType = 'email'
  }

  fields.push(
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
  )

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
      <CreateFirstUserClient initialState={formState} loginType={loginType} userSlug={userSlug} />
    </div>
  )
}
