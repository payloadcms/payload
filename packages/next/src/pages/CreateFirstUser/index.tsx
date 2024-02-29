import type { Metadata } from 'next'
import type { Field } from 'payload/types'
import type { SanitizedConfig } from 'payload/types'

import { Form, FormSubmit, MinimalTemplate, buildStateFromSchema } from '@payloadcms/ui'
import React from 'react'

import { getNextI18n } from '../../utilities/getNextI18n'
import { initPage } from '../../utilities/initPage'
import { meta } from '../../utilities/meta'
import { CreateFirstUserFields } from './index.client'
import './index.scss'

const baseClass = 'create-first-user'

export const generateMetadata = async ({
  config: configPromise,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const config = await configPromise

  const { t } = await getNextI18n({
    config,
  })

  return meta({
    config,
    description: t('authentication:createFirstUser'),
    keywords: t('general:create'),
    title: t('authentication:createFirstUser'),
  })
}

export const CreateFirstUser: React.FC<{
  config: Promise<SanitizedConfig>
}> = async ({ config: configPromise }) => {
  const { req } = await initPage({
    config: configPromise,
    redirectUnauthenticatedUser: false,
  })

  const { config } = req.payload

  const {
    admin: { user: userSlug },
    routes: { admin: adminRoute, api: apiRoute },
    serverURL,
  } = config

  const fields = [
    {
      name: 'email',
      type: 'email',
      label: req.t('general:emailAddress'),
      required: true,
    },
    {
      name: 'password',
      type: 'password',
      label: req.t('general:password'),
      required: true,
    },
    {
      name: 'confirm-password',
      type: 'confirmPassword',
      label: req.t('authentication:confirmPassword'),
      required: true,
    },
  ] as Field[]

  const formState = await buildStateFromSchema({
    fieldSchema: fields,
    operation: 'create',
    preferences: {},
    req,
  })

  return (
    <MinimalTemplate className={baseClass}>
      <h1>{req.t('general:welcome')}</h1>
      <p>{req.t('authentication:beginCreateFirstUser')}</p>
      <Form
        action={`${serverURL}${apiRoute}/${userSlug}/first-register`}
        initialState={formState}
        method="POST"
        // onSuccess={onSuccess}
        redirect={adminRoute}
        validationOperation="create"
      >
        <CreateFirstUserFields userSlug={userSlug} />
        <FormSubmit>{req.t('general:create')}</FormSubmit>
      </Form>
    </MinimalTemplate>
  )
}
