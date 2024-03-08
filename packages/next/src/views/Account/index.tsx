import type { Data, DocumentPreferences, ServerSideEditViewProps } from 'payload/types'

import {
  DocumentHeader,
  DocumentInfoProvider,
  FormQueryParamsProvider,
  HydrateClientUser,
  RenderCustomComponent,
  buildStateFromSchema,
  formatFields,
} from '@payloadcms/ui'
import { notFound } from 'next/navigation.js'
import React from 'react'

import type { AdminViewProps } from '../Root/index.js'

import { formatTitle } from '../Edit/Default/SetDocumentTitle/formatTitle.js'
import { EditView } from '../Edit/index.js'
import { Settings } from './Settings/index.js'

export { generateAccountMetadata } from './meta.js'

export const Account: React.FC<AdminViewProps> = async ({ initPageResult, searchParams }) => {
  const {
    permissions,
    locale,
    req: {
      i18n,
      payload,
      payload: { config },
      user,
    },
    req,
  } = initPageResult

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
      operation: 'update',
      preferences: docPreferences,
      req,
    })

    const serverSideProps: ServerSideEditViewProps = {
      initPageResult,
      routeSegments: [],
      searchParams,
    }

    return (
      <DocumentInfoProvider
        AfterFields={<Settings />}
        action={`${serverURL}${api}/${userSlug}${data?.id ? `/${data.id}` : ''}`}
        apiURL={`${serverURL}${api}/${userSlug}${data?.id ? `/${data.id}` : ''}`}
        collectionSlug={userSlug}
        docPermissions={collectionPermissions}
        docPreferences={docPreferences}
        hasSavePermission={collectionPermissions?.update?.permission}
        id={user?.id}
        initialData={data}
        initialState={initialState}
        isEditing
        title={formatTitle({
          collectionConfig,
          dateFormat: config.admin.dateFormat,
          i18n,
          value: data?.[collectionConfig?.admin?.useAsTitle] || data?.id?.toString(),
        })}
      >
        <DocumentHeader
          collectionConfig={collectionConfig}
          config={payload.config}
          hideTabs
          i18n={i18n}
        />
        <HydrateClientUser permissions={permissions} user={user} />
        <FormQueryParamsProvider
          initialParams={{
            depth: 0,
            'fallback-locale': 'null',
            locale: locale.code,
            uploadEdits: undefined,
          }}
        >
          <RenderCustomComponent
            CustomComponent={
              typeof CustomAccountComponent === 'function' ? CustomAccountComponent : undefined
            }
            DefaultComponent={EditView}
            componentProps={serverSideProps}
          />
        </FormQueryParamsProvider>
      </DocumentInfoProvider>
    )
  }

  return notFound()
}
