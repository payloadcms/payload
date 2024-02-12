import { DocumentPreferences, SanitizedConfig, TypeWithID } from 'payload/types'
import React, { Fragment } from 'react'
import {
  RenderCustomComponent,
  HydrateClientUser,
  buildStateFromSchema,
  formatFields,
  fieldTypes,
  DefaultEditView,
  DefaultEditViewProps,
} from '@payloadcms/ui'
import { initPage } from '../../utilities/initPage'
import { notFound } from 'next/navigation'
import { ToggleTheme } from './ToggleTheme'
import { Settings } from './Settings'

export const Account = async ({
  config: configPromise,
  searchParams,
}: {
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const { config, payload, permissions, user, i18n, locale } = await initPage({
    config: configPromise,
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

    const { docs: [{ value: docPreferences } = { value: null }] = [] } = (await payload.find({
      collection: 'payload-preferences',
      depth: 0,
      where: {
        key: {
          equals: preferencesKey,
        },
      },
      limit: 1,
    })) as any as { docs: { value: DocumentPreferences }[] }

    const formState = await buildStateFromSchema({
      id: user?.id,
      data: data || {},
      fieldSchema,
      locale: locale.code,
      operation: 'update',
      preferences: docPreferences,
      t: i18n.t,
      user,
    })

    const componentProps: DefaultEditViewProps = {
      action: `${serverURL}${api}/${userSlug}/${data?.id}?locale=${locale}`,
      apiURL: `${serverURL}${api}/${userSlug}/${data?.id}?locale=${locale}`,
      collectionSlug: userSlug,
      data,
      fieldTypes,
      hasSavePermission: collectionPermissions?.update?.permission,
      formState,
      onSave: () => {},
      docPermissions: collectionPermissions,
      docPreferences,
      user,
      updatedAt: '', // TODO
      id: user?.id,
      locale,
      AfterDocument: (
        <Fragment>
          <Settings />
          <ToggleTheme />
        </Fragment>
      ),
    }

    return (
      <Fragment>
        <HydrateClientUser user={user} permissions={permissions} />
        <RenderCustomComponent
          CustomComponent={
            typeof CustomAccountComponent === 'function' ? CustomAccountComponent : undefined
          }
          DefaultComponent={DefaultEditView}
          componentProps={componentProps}
        />
      </Fragment>
    )
  }

  return notFound()
}
