import { SanitizedConfig, TypeWithID } from 'payload/types'
import React, { Fragment } from 'react'
import {
  RenderCustomComponent,
  HydrateClientUser,
  buildStateFromSchema,
  findLocaleFromCode,
  formatFields,
  fieldTypes,
} from '@payloadcms/ui'
import { initPage } from '../../utilities/initPage'
import { notFound } from 'next/navigation'
import { DefaultAccount, DefaultAccountViewProps } from './Default'

export const Account = async ({
  config: configPromise,
  searchParams,
}: {
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const { config, payload, permissions, user, i18n, locale } = await initPage({
    configPromise,
    redirectUnauthenticatedUser: true,
  })

  const {
    admin: { user: userSlug, components: { views: { Account: CustomAccountComponent } = {} } = {} },
    routes: { api },
    serverURL,
  } = config

  const collectionPermissions = permissions?.collections?.[userSlug]

  const collectionConfig = config.collections.find((collection) => collection.slug === userSlug)

  if (collectionConfig) {
    const { fields } = collectionConfig

    let data: TypeWithID & Record<string, unknown>

    try {
      data = await payload.findByID({
        collection: userSlug,
        id: user.id,
        depth: 0,
        user,
      })
    } catch (error) {
      return notFound()
    }

    const fieldSchema = formatFields(fields, true)

    let preferencesKey: string

    if (user?.id) {
      preferencesKey = `collection-${userSlug}-${user.id}`
    }

    const {
      docs: [preferences],
    } = await payload.find({
      collection: 'payload-preferences',
      depth: 0,
      pagination: false,
      user,
      limit: 1,
      where: {
        key: {
          equals: preferencesKey,
        },
      },
    })

    const formState = await buildStateFromSchema({
      id: user?.id,
      data: data || {},
      fieldSchema,
      locale: locale.code,
      operation: 'update',
      preferences,
      t: i18n.t,
      user,
    })

    const componentProps: DefaultAccountViewProps = {
      action: `${serverURL}${api}/${userSlug}/${data?.id}?locale=${locale}`,
      apiURL: `${serverURL}${api}/${userSlug}/${data?.id}?locale=${locale}`,
      config,
      collectionConfig,
      data,
      fieldTypes,
      hasSavePermission: collectionPermissions?.update?.permission,
      formState,
      onSave: () => {},
      permissions,
      docPermissions: collectionPermissions,
      user,
      updatedAt: '', // TODO
      id: user?.id,
      i18n,
      payload,
      locale: locale.code,
      searchParams,
    }

    return (
      <Fragment>
        <HydrateClientUser user={user} permissions={permissions} />
        <RenderCustomComponent
          CustomComponent={
            typeof CustomAccountComponent === 'function' ? CustomAccountComponent : undefined
          }
          DefaultComponent={DefaultAccount}
          componentProps={componentProps}
        />
      </Fragment>
    )
  }

  return notFound()
}
