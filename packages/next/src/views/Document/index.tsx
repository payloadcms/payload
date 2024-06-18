import type {
  AdminViewComponent,
  AdminViewProps,
  EditViewComponent,
  ServerSideEditViewProps,
} from 'payload'

import {
  DocumentInfoProvider,
  EditDepthProvider,
  FormQueryParamsProvider,
  HydrateClientUser,
} from '@payloadcms/ui/client'
import { RenderCustomComponent, isEditing as getIsEditing } from '@payloadcms/ui/shared'
import { notFound, redirect } from 'next/navigation.js'
import QueryString from 'qs'
import React from 'react'

import type { GenerateEditViewMetadata } from './getMetaBySegment.js'

import { DocumentHeader } from '../../elements/DocumentHeader/index.js'
import { NotFoundView } from '../NotFound/index.js'
import { getDocumentData } from './getDocumentData.js'
import { getDocumentPermissions } from './getDocumentPermissions.js'
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
          routes: { admin: adminRoute, api: apiRoute },
          serverURL,
        },
      },
      user,
    },
    visibleEntities,
  } = initPageResult

  const segments = Array.isArray(params?.segments) ? params.segments : []
  const collectionSlug = collectionConfig?.slug || undefined
  const globalSlug = globalConfig?.slug || undefined

  const isEditing = getIsEditing({ id, collectionSlug, globalSlug })

  let ViewOverride: EditViewComponent
  let CustomView: EditViewComponent
  let DefaultView: EditViewComponent
  let ErrorView: AdminViewComponent

  let apiURL: string
  let action: string

  const { data, formState } = await getDocumentData({
    id,
    collectionConfig,
    globalConfig,
    locale,
    req,
  })

  const { docPermissions, hasPublishPermission, hasSavePermission } = await getDocumentPermissions({
    id,
    collectionConfig,
    data,
    globalConfig,
    req,
  })

  if (collectionConfig) {
    if (!visibleEntities?.collections?.find((visibleSlug) => visibleSlug === collectionSlug)) {
      notFound()
    }

    action = `${serverURL}${apiRoute}/${collectionSlug}${isEditing ? `/${id}` : ''}`
    const apiQueryParams = QueryString.stringify(
      {
        draft: collectionConfig.versions?.drafts ? 'true' : undefined,
        locale: locale?.code,
      },
      { addQueryPrefix: true },
    )
    apiURL = `${serverURL}${apiRoute}/${collectionSlug}/${id}${apiQueryParams}`

    const editConfig = collectionConfig?.admin?.components?.views?.Edit
    ViewOverride = typeof editConfig === 'function' ? editConfig : null

    if (!ViewOverride) {
      const collectionViews = getViewsFromConfig({
        collectionConfig,
        config,
        docPermissions,
        routeSegments: segments,
      })

      CustomView = collectionViews?.CustomView
      DefaultView = collectionViews?.DefaultView
      ErrorView = collectionViews?.ErrorView
    }

    if (!CustomView && !DefaultView && !ViewOverride && !ErrorView) {
      ErrorView = NotFoundView
    }
  }

  if (globalConfig) {
    if (!visibleEntities?.globals?.find((visibleSlug) => visibleSlug === globalSlug)) {
      notFound()
    }

    action = `${serverURL}${apiRoute}/globals/${globalSlug}`

    const apiQueryParams = QueryString.stringify(
      {
        draft: globalConfig.versions?.drafts ? 'true' : undefined,
        locale: locale?.code,
      },
      { addQueryPrefix: true },
    )
    apiURL = `${serverURL}${apiRoute}/${globalSlug}${apiQueryParams}`

    const editConfig = globalConfig?.admin?.components?.views?.Edit
    ViewOverride = typeof editConfig === 'function' ? editConfig : null

    if (!ViewOverride) {
      const globalViews = getViewsFromConfig({
        config,
        docPermissions,
        globalConfig,
        routeSegments: segments,
      })

      CustomView = globalViews?.CustomView
      DefaultView = globalViews?.DefaultView
      ErrorView = globalViews?.ErrorView

      if (!CustomView && !DefaultView && !ViewOverride && !ErrorView) {
        ErrorView = NotFoundView
      }
    }
  }

  /**
   * Handle case where autoSave is enabled and the document is being created
   * => create document and redirect
   */
  const shouldAutosave =
    hasSavePermission &&
    ((collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.autosave) ||
      (globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave))
  const validateDraftData =
    collectionConfig?.versions?.drafts && collectionConfig?.versions?.drafts?.validate

  if (shouldAutosave && !validateDraftData && !id && collectionSlug) {
    const doc = await payload.create({
      collection: collectionSlug,
      data: {},
      depth: 0,
      draft: true,
      fallbackLocale: null,
      locale: locale?.code,
      req,
      user,
    })

    if (doc?.id) {
      const redirectURL = `${serverURL}${adminRoute}/collections/${collectionSlug}/${doc.id}`
      redirect(redirectURL)
    } else {
      notFound()
    }
  }

  const viewComponentProps: ServerSideEditViewProps = {
    initPageResult,
    params,
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
      globalSlug={globalConfig?.slug}
      hasPublishPermission={hasPublishPermission}
      hasSavePermission={hasSavePermission}
      id={id}
      initialData={data}
      initialState={formState}
      isEditing={isEditing}
    >
      {!ViewOverride && (
        <DocumentHeader
          collectionConfig={collectionConfig}
          config={payload.config}
          globalConfig={globalConfig}
          i18n={i18n}
          permissions={permissions}
        />
      )}
      <HydrateClientUser permissions={permissions} user={user} />
      <EditDepthProvider
        depth={1}
        key={`${collectionSlug || globalSlug}${locale?.code ? `-${locale?.code}` : ''}`}
      >
        <FormQueryParamsProvider
          initialParams={{
            depth: 0,
            'fallback-locale': 'null',
            locale: locale?.code,
            uploadEdits: undefined,
          }}
        >
          {ErrorView ? (
            <ErrorView initPageResult={initPageResult} searchParams={searchParams} />
          ) : (
            <RenderCustomComponent
              CustomComponent={ViewOverride || CustomView}
              DefaultComponent={DefaultView}
              componentProps={viewComponentProps}
              serverOnlyProps={{
                i18n,
                locale,
                params,
                payload,
                permissions,
                searchParams,
                user,
              }}
            />
          )}
        </FormQueryParamsProvider>
      </EditDepthProvider>
    </DocumentInfoProvider>
  )
}
