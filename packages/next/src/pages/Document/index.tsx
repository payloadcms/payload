import type { TFunction } from '@payloadcms/translations'
import type { QueryParamTypes } from '@payloadcms/ui'
import type { Metadata } from 'next'
import type { AdminViewComponent } from 'payload/config'
import type {
  DocumentPreferences,
  Document as DocumentType,
  Field,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
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

import { getNextI18n } from '../../utilities/getNextI18n'
import { initPage } from '../../utilities/initPage'
import { meta } from '../../utilities/meta.ts'
import { getViewsFromConfig } from './getViewsFromConfig'

export type GenerateEditViewMetadata = (args: {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: SanitizedGlobalConfig
  isEditing: boolean
  t: TFunction
}) => Promise<Metadata>

export const generateMetadata = async ({
  config: configPromise,
  params,
}: {
  config: Promise<SanitizedConfig>
  params: {
    collection?: string
    global?: string
    segments: string[]
  }
}): Promise<Metadata> => {
  const config = await configPromise

  let fn: GenerateEditViewMetadata | null = null

  const isEditing = Boolean(
    params.collection && params.segments?.length > 0 && params.segments[0] !== 'create',
  )

  if (params?.segments?.length) {
    // `/:id`
    if (params.segments.length === 1) {
      fn = await import('../Edit/meta.ts').then((mod) => mod.generateMetadata)
    }

    // `/:id/api`
    if (params.segments.length === 2 && params.segments[1] === 'api') {
      fn = await import('../API/meta.ts').then((mod) => mod.generateMetadata)
    }

    // `/:id/preview`
    if (params.segments.length === 2 && params.segments[1] === 'preview') {
      fn = await import('../LivePreview/meta.ts').then((mod) => mod.generateMetadata)
    }

    // `/:id/versions`
    if (params.segments.length === 2 && params.segments[1] === 'versions') {
      fn = await import('../Versions/meta.ts').then((mod) => mod.generateMetadata)
    }

    // `/:id/versions/:version`
    if (params.segments.length === 2 && params.segments[1] === 'versions') {
      fn = await import('../Version/meta.ts').then((mod) => mod.generateMetadata)
    }
  }

  const { t } = await getNextI18n({
    config,
  })

  const collectionConfig = params.collection
    ? config?.collections?.find((collection) => collection.slug === params.collection)
    : null

  const globalConfig = params.global
    ? config?.globals?.find((global) => global.slug === params.global)
    : null

  if (typeof fn === 'function') {
    return fn({
      collectionConfig,
      config,
      globalConfig,
      isEditing,
      t,
    })
  }

  return meta({
    config,
    description: '',
    keywords: '',
    title: '',
  })
}

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
