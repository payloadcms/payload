import type { EditViewComponent } from 'payload/config'
import type {
  DocumentPreferences,
  Document as DocumentType,
  Field,
  ServerSideEditViewProps,
} from 'payload/types'
import type { DocumentPermissions } from 'payload/types'
import type { AdminViewProps } from 'payload/types'

import {
  DocumentHeader,
  DocumentInfoProvider,
  EditDepthProvider,
  FormQueryParamsProvider,
  HydrateClientUser,
  RenderCustomComponent,
  buildStateFromSchema,
  formatDocTitle,
  formatFields,
} from '@payloadcms/ui'
import { docAccessOperation } from 'payload/operations'
import React from 'react'

import type { GenerateEditViewMetadata } from './getMetaBySegment.js'

import { NotFoundClient } from '../NotFound/index.client.js'
import { getMetaBySegment } from './getMetaBySegment.js'
import { getViewsFromConfig } from './getViewsFromConfig.js'

export const generateMetadata: GenerateEditViewMetadata = async (args) => getMetaBySegment(args)

export const Document: React.FC<AdminViewProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
  const {
    collectionConfig,
    docID: id,
    globalConfig,
    locale,
    permissions,
    req,
    req: {
      i18n,
      payload,
      payload: {
        config,
        config: {
          routes: { api: apiRoute },
          serverURL,
        },
      },
      user,
    },
  } = initPageResult

  const segments = Array.isArray(params?.segments) ? params.segments : []
  const collectionSlug = collectionConfig?.slug || undefined
  const globalSlug = globalConfig?.slug || undefined

  const isEditing = Boolean(globalSlug || (collectionSlug && !!id))

  let CustomView: EditViewComponent
  let DefaultView: EditViewComponent
  let data: DocumentType
  let docPermissions: DocumentPermissions
  let preferencesKey: string
  let fields: Field[]
  let hasSavePermission: boolean
  let apiURL: string
  let action: string

  if (collectionConfig) {
    docPermissions = await docAccessOperation({
      id,
      collection: {
        config: collectionConfig,
      },
      req,
    })

    fields = collectionConfig.fields
    action = `${serverURL}${apiRoute}/${collectionSlug}${isEditing ? `/${id}` : ''}`

    hasSavePermission =
      (isEditing && permissions?.collections?.[collectionSlug]?.update?.permission) ||
      (!isEditing && permissions?.collections?.[collectionSlug]?.create?.permission)

    apiURL = `${serverURL}${apiRoute}/${collectionSlug}/${id}?locale=${locale.code}${
      collectionConfig.versions?.drafts ? '&draft=true' : ''
    }`

    const collectionViews = getViewsFromConfig({
      collectionConfig,
      config,
      docPermissions,
      routeSegments: segments,
      user,
    })

    CustomView = collectionViews?.CustomView
    DefaultView = collectionViews?.DefaultView

    if (!CustomView && !DefaultView) {
      const ErrorView = collectionViews?.ErrorView || NotFoundClient
      return <ErrorView initPageResult={initPageResult} searchParams={searchParams} />
    }

    if (id) {
      try {
        data = await payload.findByID({
          id,
          collection: collectionSlug,
          depth: 0,
          fallbackLocale: null,
          locale: locale.code,
          overrideAccess: false,
          user,
        })
      } catch (error) {} // eslint-disable-line no-empty

      if (!data) {
        return <NotFoundClient />
      }

      preferencesKey = `collection-${collectionSlug}-${id}`
    }
  }

  if (globalConfig) {
    docPermissions = permissions?.globals?.[globalSlug]
    fields = globalConfig.fields
    hasSavePermission = isEditing && docPermissions?.update?.permission
    action = `${serverURL}${apiRoute}/globals/${globalSlug}`

    apiURL = `${serverURL}${apiRoute}/${globalSlug}?locale=${locale.code}${
      globalConfig.versions?.drafts ? '&draft=true' : ''
    }`

    const globalViews = getViewsFromConfig({
      config,
      docPermissions,
      globalConfig,
      routeSegments: segments,
      user,
    })

    CustomView = globalViews?.CustomView
    DefaultView = globalViews?.DefaultView

    if (!CustomView && !DefaultView) {
      const ErrorView = globalViews?.ErrorView || NotFoundClient
      return <ErrorView initPageResult={initPageResult} searchParams={searchParams} />
    }

    try {
      data = await payload.findGlobal({
        slug: globalSlug,
        depth: 0,
        fallbackLocale: null,
        locale: locale.code,
        overrideAccess: false,
        user,
      })
    } catch (error) {} // eslint-disable-line no-empty

    if (!data) {
      return <NotFoundClient />
    }

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
  })) as any as { docs: { value: DocumentPreferences }[] } // eslint-disable-line @typescript-eslint/no-explicit-any

  const initialState = await buildStateFromSchema({
    id,
    data: data || {},
    fieldSchema: formatFields(fields, isEditing),
    operation: isEditing ? 'update' : 'create',
    preferences: docPreferences,
    req,
  })

  const serverSideProps: ServerSideEditViewProps = {
    initPageResult,
    routeSegments: segments,
    searchParams,
  }

  return (
    <DocumentInfoProvider
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
      isEditing={isEditing}
      title={formatDocTitle({
        collectionConfig,
        data,
        dateFormat: config.admin.dateFormat,
        fallback: id?.toString(),
        globalConfig,
        i18n,
      })}
    >
      <DocumentHeader
        collectionConfig={collectionConfig}
        config={payload.config}
        globalConfig={globalConfig}
        i18n={i18n}
      />
      <HydrateClientUser permissions={permissions} user={user} />
      <EditDepthProvider depth={1} key={`${collectionSlug || globalSlug}-${locale.code}`}>
        <FormQueryParamsProvider
          initialParams={{
            depth: 0,
            'fallback-locale': 'null',
            locale: locale.code,
            uploadEdits: undefined,
          }}
        >
          <RenderCustomComponent
            CustomComponent={typeof CustomView === 'function' ? CustomView : undefined}
            DefaultComponent={DefaultView}
            componentProps={serverSideProps}
          />
        </FormQueryParamsProvider>
      </EditDepthProvider>
    </DocumentInfoProvider>
  )
}
