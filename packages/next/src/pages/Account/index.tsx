import { SanitizedConfig } from 'payload/types'
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

export const Account = async ({
  collectionSlug,
  config: configPromise,
  searchParams,
}: {
  collectionSlug: string
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const { config, payload, permissions, user } = await initPage(configPromise)

  const {
    admin: { components: { views: { Account: CustomAccountComponent } = {} } = {} },
    routes: { api },
    localization,
    serverURL,
  } = config

  const defaultLocale =
    localization && localization.defaultLocale ? localization.defaultLocale : 'en'

  const localeCode = (searchParams?.locale as string) || defaultLocale

  const locale = localization && findLocaleFromCode(localization, localeCode)

  const collectionPermissions = permissions?.collections?.[collectionSlug]

  const collectionConfig = config.collections.find(
    (collection) => collection.slug === collectionSlug,
  )

  if (collectionConfig) {
    const data = await payload.findByID({
      collection: collectionSlug,
      id: user.id,
      depth: 0,
      user,
    })

    const fieldSchema = formatFields(collectionConfig, true)

    let preferencesKey: string

    if (user?.id) {
      preferencesKey = `collection-${collectionSlug}-${user.id}`
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
      config: collectionConfig,
      data: data || {},
      fieldSchema,
      locale,
      operation: 'update',
      preferences,
      // t,
      user,
    })

    const componentProps: DefaultAccountViewProps = {
      action: `${serverURL}${api}/${collectionSlug}/${data?.id}?locale=${locale}`,
      apiURL: `${serverURL}${api}/${collectionSlug}/${data?.id}?locale=${locale}`,
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
        <HydrateClientUser user={user} />
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

  return null
}
