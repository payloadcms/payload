import { Data, DocumentPreferences, SanitizedConfig } from 'payload/types'
import React, { Fragment } from 'react'
import {
  RenderCustomComponent,
  HydrateClientUser,
  buildStateFromSchema,
  formatFields,
  ServerSideEditViewProps,
  SetDocumentInfo,
} from '@payloadcms/ui'
import { initPage } from '../../utilities/initPage'
import { notFound } from 'next/navigation'
import { EditView } from '../Edit'
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
    searchParams,
    route: `/account`,
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

    let data: Data

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

    const initialState = await buildStateFromSchema({
      id: user?.id,
      data: data || {},
      fieldSchema,
      locale: locale.code,
      operation: 'update',
      preferences: docPreferences,
      t: i18n.t,
      user,
    })

    const componentProps: ServerSideEditViewProps = {
      action: `${serverURL}${api}/${userSlug}/${data?.id}?locale=${locale}`,
      apiURL: `${serverURL}${api}/${userSlug}/${data?.id}?locale=${locale}`,
      collectionSlug: userSlug,
      data,
      hasSavePermission: collectionPermissions?.update?.permission,
      initialState,
      docPermissions: collectionPermissions,
      docPreferences,
      user,
      updatedAt: '', // TODO
      id: user?.id,
      config,
      i18n,
      payload,
      permissions,
      searchParams,
    }

    return (
      <Fragment>
        <HydrateClientUser user={user} permissions={permissions} />
        <SetDocumentInfo
          action={`${serverURL}${api}/${userSlug}/${data?.id}?locale=${locale}`}
          apiURL={`${serverURL}${api}/${userSlug}/${data?.id}?locale=${locale}`}
          collectionSlug={userSlug}
          initialData={data}
          hasSavePermission={collectionPermissions?.update?.permission}
          initialState={initialState}
          docPermissions={collectionPermissions}
          docPreferences={docPreferences}
          id={user?.id}
          AfterFields={<Settings />}
        />
        <RenderCustomComponent
          CustomComponent={
            typeof CustomAccountComponent === 'function' ? CustomAccountComponent : undefined
          }
          DefaultComponent={EditView}
          componentProps={componentProps}
        />
      </Fragment>
    )
  }

  return notFound()
}
