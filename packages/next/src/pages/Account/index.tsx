import { SanitizedConfig, TypeWithID } from 'payload/types'
import React, { Fragment } from 'react'
import {
  RenderCustomComponent,
  DefaultAccount,
  HydrateClientUser,
  DefaultAccountViewProps,
  buildStateFromSchema,
  findLocaleFromCode,
  formatFields,
  fieldTypes,
} from '@payloadcms/ui'
import { initPage } from '../../utilities/initPage'
import { notFound } from 'next/navigation'

export const Account = async ({
  config: configPromise,
  searchParams,
}: {
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const { config, payload, permissions, user } = await initPage(configPromise, true)

  const {
    admin: { user: userSlug, components: { views: { Account: CustomAccountComponent } = {} } = {} },
    routes: { api },
    localization,
    serverURL,
  } = config

  const defaultLocale =
    localization && localization.defaultLocale ? localization.defaultLocale : 'en'

  const localeCode = (searchParams?.locale as string) || defaultLocale

  const locale = localization && findLocaleFromCode(localization, localeCode)

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

    const state = await buildStateFromSchema({
      id: user?.id,
      config,
      data: data || {},
      fieldSchema,
      locale,
      operation: 'update',
      preferences,
      // t,
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
      initialState: state,
      onSave: () => {},
      isLoading: false,
      permissions: collectionPermissions,
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
