import type {
  AdminViewServerProps,
  DocumentViewServerPropsOnly,
  RenderDocumentVersionsProperties,
} from 'payload'

import {
  DocumentInfoProvider,
  EditDepthProvider,
  HydrateAuthProvider,
  LivePreviewProvider,
} from '@payloadcms/ui'
import { getDocumentViewData } from '@payloadcms/ui/server'
import { isEditing as getIsEditing } from '@payloadcms/ui/shared'
import { notFound, redirect } from 'next/navigation.js'
import { logError } from 'payload'
import React from 'react'

import type { GenerateEditViewMetadata } from './getMetaBySegment.js'

import { DocumentHeader } from '../../elements/DocumentHeader/index.js'
import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { EditView } from '../Edit/index.js'
import { NotFoundView } from '../NotFound/index.js'
import { VersionView } from '../Version/index.js'
import { VersionsView } from '../Versions/index.js'
import { getMetaBySegment } from './getMetaBySegment.js'

export const generateMetadata: GenerateEditViewMetadata = async (args) => getMetaBySegment(args)

export const renderDocument = async ({
  disableActions,
  documentSubViewType,
  drawerSlug,
  importMap,
  initialData,
  initPageResult,
  overrideEntityVisibility,
  params,
  redirectAfterCreate,
  redirectAfterDelete,
  redirectAfterDuplicate,
  redirectAfterRestore,
  searchParams,
  versions,
  viewType,
}: {
  drawerSlug?: string
  overrideEntityVisibility?: boolean
  readonly redirectAfterCreate?: boolean
  readonly redirectAfterDelete?: boolean
  readonly redirectAfterDuplicate?: boolean
  readonly redirectAfterRestore?: boolean
  versions?: RenderDocumentVersionsProperties
} & AdminViewServerProps): Promise<{
  data: Record<string, unknown>
  Document: React.ReactNode
}> => {
  const {
    collectionConfig,
    cookies,
    docID: idFromArgs,
    globalConfig,
    locale,
    permissions,
    req,
    req: { i18n, payload, user },
    visibleEntities,
  } = initPageResult

  const data = await getDocumentViewData({
    collectionConfig,
    cookies,
    defaultViews: {
      edit: EditView,
      version: VersionView,
      versions: VersionsView,
    },
    disableActions,
    docID: idFromArgs,
    documentSubViewType: documentSubViewType || 'default',
    drawerSlug,
    globalConfig,
    initialData,
    locale,
    overrideEntityVisibility,
    params,
    permissions,
    redirectAfterCreate,
    renderComponent: RenderServerComponent,
    req,
    searchParams,
    versions,
    viewType,
    visibleEntities,
  })

  if (data.redirect) {
    redirect(data.redirect)
  }

  const segments = Array.isArray(params?.segments) ? params.segments : []

  const documentViewServerProps: DocumentViewServerPropsOnly = {
    doc: data.doc,
    hasPublishedDoc: data.hasPublishedDoc,
    i18n,
    initPageResult,
    locale,
    params,
    payload,
    permissions,
    renderComponent: RenderServerComponent,
    routeSegments: segments,
    searchParams,
    user,
    versions,
  }

  const { Description } = data.slots

  return {
    data: data.doc,
    Document: (
      <DocumentInfoProvider
        apiURL={data.apiURL}
        collectionSlug={collectionConfig?.slug}
        currentEditor={data.currentEditor}
        disableActions={data.disableActions}
        docPermissions={data.docPermissions}
        globalSlug={globalConfig?.slug}
        hasDeletePermission={data.hasDeletePermission}
        hasPublishedDoc={data.hasPublishedDoc}
        hasPublishPermission={data.hasPublishPermission}
        hasSavePermission={data.hasSavePermission}
        hasTrashPermission={data.hasTrashPermission}
        id={data.id}
        initialData={data.doc}
        initialState={data.formState}
        isEditing={data.isEditing}
        isLocked={data.isLocked}
        isTrashed={data.isTrashedDoc}
        key={locale?.code}
        lastUpdateTime={data.lastUpdateTime}
        mostRecentVersionIsAutosaved={data.mostRecentVersionIsAutosaved}
        redirectAfterCreate={redirectAfterCreate}
        redirectAfterDelete={redirectAfterDelete}
        redirectAfterDuplicate={redirectAfterDuplicate}
        redirectAfterRestore={redirectAfterRestore}
        unpublishedVersionCount={data.unpublishedVersionCount}
        versionCount={data.versionCount}
      >
        <LivePreviewProvider
          breakpoints={data.livePreviewBreakpoints}
          isLivePreviewEnabled={data.isLivePreviewEnabled}
          isLivePreviewing={Boolean(
            data.entityPreferences?.value?.editViewType === 'live-preview' && data.livePreviewURL,
          )}
          isPreviewEnabled={data.isPreviewEnabled}
          previewURL={data.previewURL}
          typeofLivePreviewURL={data.typeofLivePreviewURL}
          url={data.livePreviewURL}
        >
          {data.showHeader && !drawerSlug && (
            <DocumentHeader
              AfterHeader={Description}
              collectionConfig={collectionConfig}
              globalConfig={globalConfig}
              permissions={permissions}
              renderComponent={RenderServerComponent}
              req={req}
            />
          )}
          <HydrateAuthProvider permissions={permissions} />
          <EditDepthProvider>
            {RenderServerComponent({
              clientProps: data.clientProps,
              Component: data.View,
              importMap,
              serverProps: documentViewServerProps,
            })}
          </EditDepthProvider>
        </LivePreviewProvider>
      </DocumentInfoProvider>
    ),
  }
}

export async function DocumentView(props: AdminViewServerProps) {
  try {
    const { Document: RenderedDocument } = await renderDocument(props)

    return RenderedDocument
  } catch (error) {
    if (error?.message === 'NEXT_REDIRECT') {
      throw error
    }

    logError({ err: error, payload: props.initPageResult.req.payload })

    if (error.message === 'not-found') {
      notFound()
    }
  }
}
