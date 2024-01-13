import type { Document as DocumentType, Field, SanitizedConfig } from 'payload/types'
import React, { Fragment } from 'react'
import { initPage } from '../../utilities/initPage'
import {
  EditDepthProvider,
  RenderCustomComponent,
  fieldTypes,
  buildStateFromSchema,
  formatFields,
  FormQueryParamsProvider,
  QueryParamTypes,
  HydrateClientUser,
  DocumentInfoProvider,
} from '@payloadcms/ui'
import type { EditViewProps } from '@payloadcms/ui'
import queryString from 'qs'
import { notFound } from 'next/navigation'
import { TFunction } from 'i18next'
import { AdminViewComponent } from 'payload/config'
import { getViewsFromConfig } from './getViewsFromConfig'
import type { DocumentPermissions } from 'payload/types'

export const Document = async ({
  params,
  config: configPromise,
  searchParams,
}: {
  params: {
    segments: string[]
    collection?: string
    global?: string
  }
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const collectionSlug = params.collection
  const globalSlug = params.global
  const isCreating = params.segments?.length === 1 && params.segments?.[0] === 'create'
  const id = (collectionSlug && !isCreating && params.segments[0]) || undefined
  const isEditing = Boolean(globalSlug || (collectionSlug && !!id))

  const { config, payload, permissions, user, collectionConfig, globalConfig, locale, i18n } =
    await initPage({
      configPromise,
      redirectUnauthenticatedUser: true,
      collectionSlug,
      globalSlug,
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
      routeSegments: params.segments,
      collectionConfig,
      config,
      docPermissions,
    })

    CustomView = collectionViews.CustomView
    DefaultView = collectionViews.DefaultView

    try {
      data = await payload.findByID({
        collection: collectionSlug,
        id,
        depth: 0,
        user,
        locale: locale.code,
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
      routeSegments: params.segments,
      globalConfig,
      config,
      docPermissions,
    })

    CustomView = globalViews.CustomView
    DefaultView = globalViews.DefaultView

    data = await payload.findGlobal({
      slug: globalSlug,
      depth: 0,
      user,
      locale: locale.code,
    })

    preferencesKey = `global-${globalSlug}`
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
    id,
    config,
    data: data || {},
    fieldSchema: formatFields(fields, isEditing),
    locale: locale.code,
    operation: isEditing ? 'update' : 'create',
    preferences,
    t: ((key: string) => key) as TFunction, // TODO: i18n
    user,
  })

  const formQueryParams: QueryParamTypes = {
    depth: 0,
    'fallback-locale': 'null',
    locale: locale.code,
    uploadEdits: undefined,
  }

  const componentProps: EditViewProps = {
    id,
    action: `${action}?${queryString.stringify(formQueryParams)}`,
    apiURL,
    canAccessAdmin: permissions?.canAccessAdmin,
    config,
    collectionConfig,
    globalConfig,
    data,
    fieldTypes,
    hasSavePermission,
    state,
    isEditing,
    permissions,
    docPermissions,
    updatedAt: data?.updatedAt?.toString(),
    user,
    onSave: () => {},
    payload,
    locale: locale.code,
    params,
    searchParams,
    i18n,
  }

  return (
    <Fragment>
      <HydrateClientUser user={user} permissions={permissions} />
      <DocumentInfoProvider
        collectionSlug={collectionConfig?.slug}
        globalSlug={globalConfig?.slug}
        id={id}
        key={`${collectionSlug || globalSlug}-${locale}`}
        versionsConfig={collectionConfig?.versions || globalConfig?.versions}
      >
        <EditDepthProvider depth={1}>
          <FormQueryParamsProvider formQueryParams={formQueryParams}>
            <RenderCustomComponent
              CustomComponent={typeof CustomView === 'function' ? CustomView : undefined}
              DefaultComponent={DefaultView}
              componentProps={componentProps}
            />
          </FormQueryParamsProvider>
        </EditDepthProvider>
      </DocumentInfoProvider>
    </Fragment>
  )
}
