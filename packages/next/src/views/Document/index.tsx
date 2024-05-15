import type { EditViewComponent } from 'payload/config'
import type { AdminViewComponent, ServerSideEditViewProps } from 'payload/types'
import type { DocumentPermissions } from 'payload/types'
import type { AdminViewProps } from 'payload/types'

import { DocumentHeader } from '@payloadcms/ui/elements/DocumentHeader'
import { HydrateClientUser } from '@payloadcms/ui/elements/HydrateClientUser'
import { RenderCustomComponent } from '@payloadcms/ui/elements/RenderCustomComponent'
import { DocumentInfoProvider } from '@payloadcms/ui/providers/DocumentInfo'
import { EditDepthProvider } from '@payloadcms/ui/providers/EditDepth'
import { FormQueryParamsProvider } from '@payloadcms/ui/providers/FormQueryParams'
import { notFound, redirect } from 'next/navigation.js'
import { docAccessOperation } from 'payload/operations'
import React from 'react'

import type { GenerateEditViewMetadata } from './getMetaBySegment.js'

import { NotFoundView } from '../NotFound/index.js'
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

  const isEditing = Boolean(globalSlug || (collectionSlug && !!id))

  let ViewOverride: EditViewComponent
  let CustomView: EditViewComponent
  let DefaultView: EditViewComponent
  let ErrorView: AdminViewComponent

  let docPermissions: DocumentPermissions
  let hasSavePermission: boolean
  let apiURL: string
  let action: string

  if (collectionConfig) {
    if (!visibleEntities?.collections?.find((visibleSlug) => visibleSlug === collectionSlug)) {
      notFound()
    }

    try {
      docPermissions = await docAccessOperation({
        id,
        collection: {
          config: collectionConfig,
        },
        req,
      })
    } catch (error) {
      notFound()
    }

    action = `${serverURL}${apiRoute}/${collectionSlug}${isEditing ? `/${id}` : ''}`

    hasSavePermission =
      (isEditing && permissions?.collections?.[collectionSlug]?.update?.permission) ||
      (!isEditing && permissions?.collections?.[collectionSlug]?.create?.permission)

    apiURL = `${serverURL}${apiRoute}/${collectionSlug}/${id}?locale=${locale.code}${
      collectionConfig.versions?.drafts ? '&draft=true' : ''
    }`

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

    docPermissions = permissions?.globals?.[globalSlug]
    hasSavePermission = isEditing && docPermissions?.update?.permission
    action = `${serverURL}${apiRoute}/globals/${globalSlug}`

    apiURL = `${serverURL}${apiRoute}/${globalSlug}?locale=${locale.code}${
      globalConfig.versions?.drafts ? '&draft=true' : ''
    }`

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

  if (shouldAutosave && !id && collectionSlug) {
    const doc = await payload.create({
      collection: collectionSlug,
      data: {},
      depth: 0,
      draft: true,
      fallbackLocale: null,
      locale: locale.code,
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
      hasSavePermission={hasSavePermission}
      id={id}
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
      <EditDepthProvider depth={1} key={`${collectionSlug || globalSlug}-${locale.code}`}>
        <FormQueryParamsProvider
          initialParams={{
            depth: 0,
            'fallback-locale': 'null',
            locale: locale.code,
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
