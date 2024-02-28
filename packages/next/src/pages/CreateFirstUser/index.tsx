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
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> => {
  const { t } = await getNextI18n({
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
      type: 'email',
      label: t('general:emailAddress'),
      required: true,
    },
    {
      name: 'password',
      type: 'password',
      label: t('general:password'),
      required: true,
    },
    {
      name: 'confirm-password',
      type: 'confirmPassword',
      label: t('authentication:confirmPassword'),
      required: true,
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
