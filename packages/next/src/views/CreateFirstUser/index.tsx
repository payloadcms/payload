import type { AdminViewProps, Field, FormState } from 'payload/types'

import { WithServerSideProps } from '@payloadcms/ui/elements/WithServerSideProps'
import { buildStateFromSchema } from '@payloadcms/ui/forms/buildStateFromSchema'
import { Logo } from '@payloadcms/ui/graphics/Logo'
import { redirect } from 'next/navigation.js'
import React, { Fragment } from 'react'

import { CreateFirstUserForm } from './CreateFirstUserForm/index.js'
import './index.scss'

export { generateCreateFirstUserMetadata } from './meta.js'

export const createFirstUserBaseClass = 'create-first-user'

export const CreateFirstUserView: React.FC<AdminViewProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
  const { locale, permissions, req } = initPageResult

  const {
    i18n,
    payload: { config },
    payload,
    user,
  } = req

  const {
    admin: { components: { afterCreateFirstUser, beforeCreateFirstUser } = {}, user: userSlug },
    collections,
    routes: { admin },
  } = config

  const BeforeCreateFirstUsers = Array.isArray(beforeCreateFirstUser)
    ? beforeCreateFirstUser.map((Component, i) => (
        <WithServerSideProps
          Component={Component}
          key={i}
          serverOnlyProps={{
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
          }}
        />
      ))
    : null

  const AfterCreateFirstUsers = Array.isArray(afterCreateFirstUser)
    ? afterCreateFirstUser.map((Component, i) => (
        <WithServerSideProps
          Component={Component}
          key={i}
          serverOnlyProps={{
            i18n,
            locale,
            params,
            payload,
            permissions,
            searchParams,
            user,
          }}
        />
      ))
    : null

  if (user) {
    redirect(admin)
  }

  const collectionConfig = collections.find(({ slug }) => slug === userSlug)

  const fields: Field[] = [
    {
      name: 'email',
      type: 'email',
      label: req.t('general:email'),
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

  const initialState: FormState = await buildStateFromSchema({
    fieldSchema: fields,
    operation: 'create',
    preferences: { fields: {} },
    req,
  })

  return (
    <Fragment>
      <div className={`${createFirstUserBaseClass}__brand`}>
        <Logo
          i18n={i18n}
          locale={locale}
          params={params}
          payload={payload}
          permissions={permissions}
          searchParams={searchParams}
          user={user}
        />
      </div>

      {Array.isArray(BeforeCreateFirstUsers) &&
        BeforeCreateFirstUsers.map((Component) => Component)}
      {!collectionConfig?.auth?.disableLocalStrategy && (
        <CreateFirstUserForm initialState={initialState} searchParams={searchParams} />
      )}
      {Array.isArray(AfterCreateFirstUsers) && AfterCreateFirstUsers.map((Component) => Component)}
    </Fragment>
  )
}
