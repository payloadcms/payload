import React from 'react'

import type { Field } from 'payload/types'
import { getNextT } from '../../utilities/getNextT'
import { Form, FormSubmit, MinimalTemplate, buildStateFromSchema } from '@payloadcms/ui'
import { SanitizedConfig } from 'payload/types'
import { Metadata } from 'next'
import { meta } from '../../utilities/meta'
import { initPage } from '../../utilities/initPage'
import { CreateFirstUserFields } from './index.client'

import './index.scss'

const baseClass = 'create-first-user'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const t = await getNextT({
    config: await config,
  })

  return meta({
    title: t('authentication:createFirstUser'),
    description: t('authentication:createFirstUser'),
    keywords: t('general:create'),
    config,
  })
}

export const CreateFirstUser: React.FC<{
  config: Promise<SanitizedConfig>
}> = async ({ config: configPromise }) => {
  const {
    config,
    user,
    locale,
    i18n: { t },
  } = await initPage({
    config: configPromise,
    redirectUnauthenticatedUser: false,
  })

  const {
    routes: { api: apiRoute, admin: adminRoute },
    admin: { user: userSlug },
    serverURL,
  } = config

  const fields = [
    {
      name: 'email',
      label: t('general:emailAddress'),
      required: true,
      type: 'email',
    },
    {
      name: 'password',
      label: t('general:password'),
      required: true,
      type: 'password',
    },
    {
      name: 'confirm-password',
      label: t('authentication:confirmPassword'),
      required: true,
      type: 'confirmPassword',
    },
  ] as Field[]

  const formState = await buildStateFromSchema({
    fieldSchema: fields,
    locale: locale.code,
    operation: 'create',
    preferences: {},
    t,
    user,
  })

  return (
    <MinimalTemplate className={baseClass}>
      <h1>{t('general:welcome')}</h1>
      <p>{t('authentication:beginCreateFirstUser')}</p>
      <Form
        action={`${serverURL}${apiRoute}/${userSlug}/first-register`}
        method="POST"
        // onSuccess={onSuccess}
        redirect={adminRoute}
        validationOperation="create"
        initialState={formState}
      >
        <CreateFirstUserFields userSlug={userSlug} />
        <FormSubmit>{t('general:create')}</FormSubmit>
      </Form>
    </MinimalTemplate>
  )
}
