import React from 'react'

import type { Field } from 'payload/types'

import { MinimalTemplate, FormSubmit, Form, RenderFields, fieldTypes } from '@payloadcms/ui'
import './index.scss'
import { SanitizedConfig } from 'payload/types'
import i18n from 'i18next'
import { Metadata } from 'next'
import { meta } from '../../utilities/meta'

const baseClass = 'create-first-user'

export const generateMetadata = async ({
  config,
}: {
  config: Promise<SanitizedConfig>
}): Promise<Metadata> =>
  meta({
    title: i18n.t('createFirstUser'),
    description: i18n.t('createFirstUser'),
    keywords: i18n.t('general:create'),
    config,
  })

export const CreateFirstUser: React.FC<{
  config: Promise<SanitizedConfig>
}> = async ({ config: configPromise }) => {
  const config = await configPromise

  const {
    admin: { user: userSlug },
    collections,
    routes: { admin, api },
    serverURL,
  } = config

  const userConfig = collections.find((collection) => collection.slug === userSlug)

  // const onSuccess = async (json) => {
  //   if (json?.user?.token) {
  //     await fetchFullUser()
  //   }

  //   setInitialized(true)
  // }

  const fields = [
    {
      name: 'email',
      label: 'Email Address',
      // label: t('general:emailAddress'),
      required: true,
      type: 'email',
    },
    {
      name: 'password',
      label: 'Password',
      // label: t('general:password'),
      required: true,
      type: 'password',
    },
    {
      name: 'confirm-password',
      label: 'Confirm Password',
      // label: t('confirmPassword'),
      required: true,
      type: 'confirmPassword',
    },
  ] as Field[]

  return (
    <MinimalTemplate className={baseClass}>
      <h1>
        Welcome
        {/* {t('general:welcome')} */}
      </h1>
      <p>
        Create your first user to get started
        {/* {t('beginCreateFirstUser')} */}
      </p>
      <Form
        action={`${serverURL}${api}/${userSlug}/first-register`}
        method="POST"
        // onSuccess={onSuccess}
        redirect={admin}
        validationOperation="create"
      >
        <RenderFields fieldSchema={[...fields, ...userConfig.fields]} fieldTypes={fieldTypes} />
        <FormSubmit>
          Create
          {/* {t('general:create')} */}
        </FormSubmit>
      </Form>
    </MinimalTemplate>
  )
}
