import type { Metadata } from 'next'
import type { Field } from 'payload/types'
import type { SanitizedConfig } from 'payload/types'

import { Form, FormSubmit, MinimalTemplate, buildStateFromSchema } from '@payloadcms/ui'
import React from 'react'

import { getNextT } from '../../utilities/getNextT'
import { initPage } from '../../utilities/initPage'
import { meta } from '../../utilities/meta'
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
    config,
    description: t('authentication:createFirstUser'),
    keywords: t('general:create'),
    title: t('authentication:createFirstUser'),
  })
}

export const CreateFirstUser: React.FC<{
  config: Promise<SanitizedConfig>
}> = async ({ config: configPromise }) => {
  const {
    config,
    i18n: { t },
    locale,
    user,
  } = await initPage({
    config: configPromise,
    redirectUnauthenticatedUser: false,
  })

  const {
    admin: { user: userSlug },
    routes: { admin: adminRoute, api: apiRoute },
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
        initialState={formState}
        method="POST"
        // onSuccess={onSuccess}
        redirect={adminRoute}
        validationOperation="create"
      >
        <CreateFirstUserFields userSlug={userSlug} />
        <FormSubmit>{t('general:create')}</FormSubmit>
      </Form>
    </MinimalTemplate>
  )
}
