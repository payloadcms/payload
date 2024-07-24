import type { AdminViewProps, Field } from 'payload'

import { buildStateFromSchema } from '@payloadcms/ui/forms/buildStateFromSchema'
import React from 'react'

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

  let loginType: LoginFieldProps['type'] = loginWithUsername ? 'username' : 'email'
  if (loginWithUsername && (loginWithUsername.allowEmailLogin || loginWithUsername.requireEmail)) {
    loginType = 'emailOrUsername'
  }

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

  const fields = [
    ...(loginWithUsername ? [usernameField] : []),
    ...(emailRequired || loginWithEmail ? [emailField] : []),
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
    fieldSchema: fields as Field[],
    operation: 'create',
    preferences: { fields: {} },
    req,
  })

  return (
    <div className="create-first-user">
      <h1>{req.t('general:welcome')}</h1>
      <p>{req.t('authentication:beginCreateFirstUser')}</p>
      <CreateFirstUserClient
        initialState={formState}
        loginType={loginType}
        requireEmail={emailRequired}
        userSlug={userSlug}
      />
    </div>
  )
}
