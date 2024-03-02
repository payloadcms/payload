import type { Metadata } from 'next'
import type { Field } from 'payload/types'
import type { SanitizedConfig } from 'payload/types'

import { Form, FormSubmit, buildStateFromSchema } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import React from 'react'

import type { InitPageResult } from '../../utilities/initPage'

import { getNextI18n } from '../../utilities/getNextI18n'
import { meta } from '../../utilities/meta'
import { CreateFirstUserFields } from './index.client'
import './index.scss'

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

type Props = {
  page: InitPageResult
  params: { [key: string]: string | string[] }
  searchParams: { [key: string]: string | string[] }
}
export const CreateFirstUser: React.FC<Props> = async ({ page }) => {
  const { req } = page
  const { config } = req.payload
  const {
    admin: { user: userSlug },
    routes: { admin: adminRoute, api: apiRoute },
    serverURL,
  } = config

  if (req.user) {
    redirect(adminRoute)
  }

  const { docs } = await req.payload.find({
    collection: userSlug,
    depth: 0,
    limit: 1,
  })

  if (docs.length > 0) {
    redirect(adminRoute)
  }

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
        <CreateFirstUserFields userSlug={userSlug} />
        <FormSubmit>{req.t('general:create')}</FormSubmit>
      </Form>
    </React.Fragment>
  )
}
