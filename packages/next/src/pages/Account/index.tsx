import type { Metadata } from 'next'
import type { Data, DocumentPreferences, SanitizedConfig } from 'payload/types'

import {
  HydrateClientUser,
  RenderCustomComponent,
  SetDocumentInfo,
  buildStateFromSchema,
  formatFields,
} from '@payloadcms/ui'
import { notFound } from 'next/navigation'
import React, { Fragment } from 'react'

import type { ServerSideEditViewProps } from '../Edit/types'

import { getNextT } from '../../utilities/getNextT'
import { initPage } from '../../utilities/initPage'
import { meta } from '../../utilities/meta'
import { EditView } from '../Edit'
import { Settings } from './Settings'

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
    description: `${t('authentication:accountOfCurrentUser')}`,
    keywords: `${t('authentication:account')}`,
    title: t('authentication:account'),
  })
}

export const Account = async ({
  config: configPromise,
  searchParams,
}: {
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const { config, i18n, locale, payload, permissions, user } = await initPage({
    config: configPromise,
    redirectUnauthenticatedUser: true,
    route: `/account`,
    searchParams,
  })

  const {
    admin: { components: { views: { Account: CustomAccountComponent } = {} } = {}, user: userSlug },
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
        id: user.id,
        collection: userSlug,
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
      limit: 1,
      where: {
        key: {
          equals: preferencesKey,
        },
      },
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
      id: user?.id,
      action: `${serverURL}${api}/${userSlug}/${data?.id}?locale=${locale}`,
      apiURL: `${serverURL}${api}/${userSlug}/${data?.id}?locale=${locale}`,
      collectionSlug: userSlug,
      config,
      data,
      docPermissions: collectionPermissions,
      docPreferences,
      hasSavePermission: collectionPermissions?.update?.permission,
      i18n,
      initialState,
      payload,
      permissions,
      searchParams,
      updatedAt: '', // TODO
      user,
    }

    return (
      <Fragment>
        <HydrateClientUser permissions={permissions} user={user} />
        <SetDocumentInfo
          AfterFields={<Settings />}
          action={`${serverURL}${api}/${userSlug}/${data?.id}?locale=${locale}`}
          apiURL={`${serverURL}${api}/${userSlug}/${data?.id}?locale=${locale}`}
          collectionSlug={userSlug}
          docPermissions={collectionPermissions}
          docPreferences={docPreferences}
          hasSavePermission={collectionPermissions?.update?.permission}
          id={user?.id}
          initialData={data}
          initialState={initialState}
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
