import type { QueryParamTypes } from '@payloadcms/ui'
import type { AdminViewComponent } from 'payload/config'
import type {
  DocumentPreferences,
  Document as DocumentType,
  Field,
  SanitizedConfig,
} from 'payload/types'
import type { DocumentPermissions } from 'payload/types'

import {
  EditDepthProvider,
  FormQueryParamsProvider,
  HydrateClientUser,
  RenderCustomComponent,
  SetDocumentInfo,
  buildStateFromSchema,
  formatFields,
} from '@payloadcms/ui'
import { notFound } from 'next/navigation'
import queryString from 'qs'
import React, { Fragment } from 'react'

import type { ServerSideEditViewProps } from '../Edit/types'

import { initPage } from '../../utilities/initPage'
import { getViewsFromConfig } from './getViewsFromConfig'

export const Document = async ({
  config: configPromise,
  params,
  searchParams,
}: {
  config: Promise<SanitizedConfig> | SanitizedConfig
  params: {
    collection?: string
    global?: string
    segments: string[]
  }
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const collectionSlug = params.collection
  const globalSlug = params.global
  const isCreating = params.segments?.length === 1 && params.segments?.[0] === 'create'
  const id = (collectionSlug && !isCreating && params.segments[0]) || undefined

  const isEditing = Boolean(globalSlug || (collectionSlug && !!id))

  const route = `/${collectionSlug || globalSlug + (params.segments?.length ? `/${params.segments.join('/')}` : '')}`

  const { collectionConfig, config, globalConfig, i18n, locale, payload, permissions, user } =
    await initPage({
      collectionSlug,
      config: configPromise,
      globalSlug,
      redirectUnauthenticatedUser: true,
      route,
      searchParams,
    })

  if (!collectionConfig && !globalConfig) {
    return notFound()
  }

  const {
    routes: { api },
    serverURL,
  } = config

  let CustomView: SanitizedConfig['admin']['components']['views'][0]
  let DefaultView: AdminViewComponent
  let data: DocumentType
  let docPermissions: DocumentPermissions
  let preferencesKey: string
  let fields: Field[]
  let hasSavePermission: boolean
  let apiURL: string
  let action: string

  if (collectionConfig) {
    docPermissions = permissions?.collections?.[collectionSlug]
    fields = collectionConfig.fields
    action = `${serverURL}${api}/${collectionSlug}${isEditing ? `/${id}` : ''}`

    hasSavePermission =
      (isEditing && permissions?.collections?.[collectionSlug]?.update?.permission) ||
      (!isEditing && permissions?.collections?.[collectionSlug]?.create?.permission)

    apiURL = `${serverURL}${api}/${collectionSlug}/${id}?locale=${locale}${
      collectionConfig.versions?.drafts ? '&draft=true' : ''
    }`

    const collectionViews = await getViewsFromConfig({
      collectionConfig,
      config,
      docPermissions,
      routeSegments: params.segments,
    })

    CustomView = collectionViews?.CustomView
    DefaultView = collectionViews?.DefaultView

    try {
      data = await payload.findByID({
        id,
        collection: collectionSlug,
        depth: 0,
        locale: locale.code,
        user,
      })
    } catch (error) {}

    if (id) {
      preferencesKey = `collection-${collectionSlug}-${id}`
    }
  }

  if (globalConfig) {
    docPermissions = permissions?.globals?.[globalSlug]
    fields = globalConfig.fields
    hasSavePermission = isEditing && docPermissions?.update?.permission
    action = `${serverURL}${api}/${globalSlug}`

    apiURL = `${serverURL}${api}/${globalSlug}?locale=${locale}${
      globalConfig.versions?.drafts ? '&draft=true' : ''
    }`

    const globalViews = await getViewsFromConfig({
      config,
      docPermissions,
      globalConfig,
      routeSegments: params.segments,
    })

    CustomView = globalViews?.CustomView
    DefaultView = globalViews?.DefaultView

    data = await payload.findGlobal({
      slug: globalSlug,
      depth: 0,
      locale: locale.code,
      user,
    })

    preferencesKey = `global-${globalSlug}`
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
    id,
    data: data || {},
    fieldSchema: formatFields(fields, isEditing),
    locale: locale.code,
    operation: isEditing ? 'update' : 'create',
    preferences: docPreferences,
    t: i18n.t,
    user,
  })

  const formQueryParams: QueryParamTypes = {
    depth: 0,
    'fallback-locale': 'null',
    locale: locale.code,
    uploadEdits: undefined,
  }

  const componentProps: ServerSideEditViewProps = {
    id,
    action: `${action}?${queryString.stringify(formQueryParams)}`,
    apiURL,
    canAccessAdmin: permissions?.canAccessAdmin,
    collectionConfig,
    collectionSlug,
    config,
    data,
    docPermissions,
    docPreferences,
    globalConfig,
    globalSlug,
    hasSavePermission,
    i18n,
    initialState,
    isEditing,
    params,
    payload,
    permissions,
    searchParams,
    updatedAt: data?.updatedAt?.toString(),
    user,
  }

  if (!DefaultView && !CustomView) {
    return notFound()
  }

  return (
    <Fragment>
      <HydrateClientUser permissions={permissions} user={user} />
      <SetDocumentInfo
        action={action}
        apiURL={apiURL}
        collectionSlug={collectionConfig?.slug}
        disableActions={false}
        docPermissions={docPermissions}
        docPreferences={docPreferences}
        globalSlug={globalConfig?.slug}
        hasSavePermission={hasSavePermission}
        id={id}
        initialData={data}
        initialState={initialState}
      />
      <EditDepthProvider depth={1} key={`${collectionSlug || globalSlug}-${locale}`}>
        <FormQueryParamsProvider formQueryParams={formQueryParams}>
          <RenderCustomComponent
            CustomComponent={typeof CustomView === 'function' ? CustomView : undefined}
            DefaultComponent={DefaultView}
            componentProps={componentProps}
          />
        </FormQueryParamsProvider>
      </EditDepthProvider>
    </Fragment>
  )
}
