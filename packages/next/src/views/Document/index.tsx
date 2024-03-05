import type { EditViewComponent } from 'payload/config'
import type {
  DocumentPreferences,
  Document as DocumentType,
  Field,
  ServerSideEditViewProps,
} from 'payload/types'
import type { DocumentPermissions } from 'payload/types'

import {
  DocumentHeader,
  EditDepthProvider,
  FormQueryParamsProvider,
  HydrateClientUser,
  RenderCustomComponent,
  SetDocumentInfo,
  buildStateFromSchema,
  formatFields,
} from '@payloadcms/ui'
import React, { Fragment } from 'react'

import type { AdminViewProps } from '../Root'
import type { GenerateEditViewMetadata } from './getMetaBySegment'

import { getMetaBySegment } from './getMetaBySegment'
import { getViewsFromConfig } from './getViewsFromConfig'

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
    docPermissions = permissions?.collections?.[collectionSlug]
    fields = collectionConfig.fields
    action = `${serverURL}${apiRoute}/${collectionSlug}${isEditing ? `/${id}` : ''}`

    hasSavePermission =
      (isEditing && permissions?.collections?.[collectionSlug]?.update?.permission) ||
      (!isEditing && permissions?.collections?.[collectionSlug]?.create?.permission)

    apiURL = `${serverURL}${apiRoute}/${collectionSlug}/${id}?locale=${locale.code}${
      collectionConfig.versions?.drafts ? '&draft=true' : ''
    }`

    const collectionViews = await getViewsFromConfig({
      collectionConfig,
      config,
      docPermissions,
      routeSegments: segments,
      user,
    })

    CustomView = collectionViews?.CustomView
    DefaultView = collectionViews?.DefaultView

    if (!CustomView && !DefaultView) {
      return <NotFoundClient />
    }

    if (id) {
      try {
        data = await payload.findByID({
          id,
          collection: collectionSlug,
          depth: 0,
          locale: locale.code,
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
    action = `${serverURL}${apiRoute}/${globalSlug}`

    apiURL = `${serverURL}${apiRoute}/${globalSlug}?locale=${locale.code}${
      globalConfig.versions?.drafts ? '&draft=true' : ''
    }`

    const globalViews = await getViewsFromConfig({
      config,
      docPermissions,
      globalConfig,
      routeSegments: segments,
      user,
    })

    CustomView = globalViews?.CustomView
    DefaultView = globalViews?.DefaultView

    if (!CustomView && !DefaultView) {
      return <NotFoundClient />
    }

    try {
      data = await payload.findGlobal({
        slug: globalSlug,
        depth: 0,
        locale: locale.code,
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

  const formQueryParams: QueryParamTypes = {
    depth: 0,
    'fallback-locale': 'null',
    locale: locale.code,
    uploadEdits: undefined,
  }
  console.log('server code', `${action}?${queryString.stringify(formQueryParams)}`)

  const componentProps: ServerSideEditViewProps = {
    id,
    action: `${action}?${queryString.stringify(formQueryParams)}`,
    apiURL,
    canAccessAdmin: permissions?.canAccessAdmin,
    collectionSlug,
    data,
    docPermissions,
    docPreferences,
    globalSlug,
    hasSavePermission,
    initPageResult,
    routeSegments: segments,
    searchParams,
  }

  return (
    <Fragment>
      <DocumentHeader
        collectionConfig={collectionConfig}
        config={payload.config}
        globalConfig={globalConfig}
        i18n={i18n}
      />
      <HydrateClientUser permissions={permissions} user={user} />
      <SetDocumentInfo
        action={`${action}?${queryString.stringify(formQueryParams)}`}
        apiURL={apiURL}
        collectionSlug={collectionConfig?.slug}
        disableActions={false}
        docPermissions={docPermissions}
        docPreferences={docPreferences}
        globalSlug={globalConfig?.slug}
        hasSavePermission={hasSavePermission}
        id={id || ''}
        initialData={data}
        initialState={initialState}
        title={formatTitle({
          collectionConfig,
          dateFormat: config.admin.dateFormat,
          globalConfig,
          i18n,
          value: data?.[collectionConfig?.admin?.useAsTitle] || id?.toString(),
        })}
      />
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
    </Fragment>
  )
}
