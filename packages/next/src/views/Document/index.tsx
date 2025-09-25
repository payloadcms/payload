import type {
  AdminViewServerProps,
  CollectionPreferences,
  Data,
  DocumentViewClientProps,
  DocumentViewServerProps,
  DocumentViewServerPropsOnly,
  EditViewComponent,
  PayloadComponent,
  RenderDocumentVersionsProperties,
} from 'payload'

import {
  DocumentInfoProvider,
  EditDepthProvider,
  HydrateAuthProvider,
  LivePreviewProvider,
} from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { handleLivePreview } from '@payloadcms/ui/rsc'
import { isEditing as getIsEditing } from '@payloadcms/ui/shared'
import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import { notFound, redirect } from 'next/navigation.js'
import { logError } from 'payload'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { GenerateEditViewMetadata } from './getMetaBySegment.js'

import { DocumentHeader } from '../../elements/DocumentHeader/index.js'
import { getPreferences } from '../../utilities/getPreferences.js'
import { NotFoundView } from '../NotFound/index.js'
import { getDocPreferences } from './getDocPreferences.js'
import { getDocumentData } from './getDocumentData.js'
import { getDocumentPermissions } from './getDocumentPermissions.js'
import { getDocumentView } from './getDocumentView.js'
import { getIsLocked } from './getIsLocked.js'
import { getMetaBySegment } from './getMetaBySegment.js'
import { getVersions } from './getVersions.js'
import { renderDocumentSlots } from './renderDocumentSlots.js'

export const generateMetadata: GenerateEditViewMetadata = async (args) => getMetaBySegment(args)

export type ViewToRender =
  | EditViewComponent
  | PayloadComponent<DocumentViewServerProps>
  | React.FC
  | React.FC<DocumentViewClientProps>

/**
 * This function is responsible for rendering
 * an Edit Document view on the server for both:
 *  - default document edit views
 *  - on-demand edit views within drawers
 */
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
  data: Data
  Document: React.ReactNode
}> => {
  const {
    collectionConfig,
    docID: idFromArgs,
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
  let isEditing = getIsEditing({ id: idFromArgs, collectionSlug, globalSlug })

  // Fetch the doc required for the view
  let doc =
    !idFromArgs && !globalSlug
      ? initialData || null
      : await getDocumentData({
          id: idFromArgs,
          collectionSlug,
          globalSlug,
          locale,
          payload,
          req,
          segments,
          user,
        })

  if (isEditing && !doc) {
    // If it's a collection document that doesn't exist, redirect to collection list
    if (collectionSlug) {
      const redirectURL = formatAdminURL({
        adminRoute,
        path: `/collections/${collectionSlug}?notFound=${encodeURIComponent(idFromArgs)}`,
        serverURL,
      })
      redirect(redirectURL)
    } else {
      // For globals or other cases, keep the 404 behavior
      throw new Error('not-found')
    }
  }

  const isTrashedDoc = typeof doc?.deletedAt === 'string'

  const [
    docPreferences,
    { docPermissions, hasPublishPermission, hasSavePermission },
    { currentEditor, isLocked, lastUpdateTime },
    entityPreferences,
  ] = await Promise.all([
    // Get document preferences
    getDocPreferences({
      id: idFromArgs,
      collectionSlug,
      globalSlug,
      payload,
      user,
    }),

    // Get permissions
    getDocumentPermissions({
      id: idFromArgs,
      collectionConfig,
      data: doc,
      globalConfig,
      req,
    }),

    // Fetch document lock state
    getIsLocked({
      id: idFromArgs,
      collectionConfig,
      globalConfig,
      isEditing,
      req,
    }),

    // get entity preferences
    getPreferences<CollectionPreferences>(
      collectionSlug ? `collection-${collectionSlug}` : `global-${globalSlug}`,
      payload,
      req.user.id,
      req.user.collection,
    ),
  ])

  const operation = (collectionSlug && idFromArgs) || globalSlug ? 'update' : 'create'

  const [
    { hasPublishedDoc, mostRecentVersionIsAutosaved, unpublishedVersionCount, versionCount },
    { state: formState },
  ] = await Promise.all([
    getVersions({
      id: idFromArgs,
      collectionConfig,
      doc,
      docPermissions,
      globalConfig,
      locale: locale?.code,
      payload,
      user,
    }),
    buildFormState({
      id: idFromArgs,
      collectionSlug,
      data: doc,
      docPermissions,
      docPreferences,
      fallbackLocale: false,
      globalSlug,
      locale: locale?.code,
      operation,
      readOnly: isTrashedDoc || isLocked,
      renderAllFields: true,
      req,
      schemaPath: collectionSlug || globalSlug,
      skipValidation: true,
    }),
  ])

  const documentViewServerProps: DocumentViewServerPropsOnly = {
    doc,
    hasPublishedDoc,
    i18n,
    initPageResult,
    locale,
    params,
    payload,
    permissions,
    routeSegments: segments,
    searchParams,
    user,
    versions,
  }

  if (
    !overrideEntityVisibility &&
    ((collectionSlug &&
      !visibleEntities?.collections?.find((visibleSlug) => visibleSlug === collectionSlug)) ||
      (globalSlug && !visibleEntities?.globals?.find((visibleSlug) => visibleSlug === globalSlug)))
  ) {
    throw new Error('not-found')
  }

  const formattedParams = new URLSearchParams()

  if (collectionConfig?.versions?.drafts || globalConfig?.versions?.drafts) {
    formattedParams.append('draft', 'true')
  }

  if (locale?.code) {
    formattedParams.append('locale', locale.code)
  }

  const apiQueryParams = `?${formattedParams.toString()}`

  const apiURL = collectionSlug
    ? `${serverURL}${apiRoute}/${collectionSlug}/${idFromArgs}${apiQueryParams}`
    : globalSlug
      ? `${serverURL}${apiRoute}/${globalSlug}${apiQueryParams}`
      : ''

  let View: ViewToRender = null

  let showHeader = true

  const RootViewOverride =
    collectionConfig?.admin?.components?.views?.edit?.root &&
    'Component' in collectionConfig.admin.components.views.edit.root
      ? collectionConfig?.admin?.components?.views?.edit?.root?.Component
      : globalConfig?.admin?.components?.views?.edit?.root &&
          'Component' in globalConfig.admin.components.views.edit.root
        ? globalConfig?.admin?.components?.views?.edit?.root?.Component
        : null

  if (RootViewOverride) {
    View = RootViewOverride
    showHeader = false
  } else {
    ;({ View } = getDocumentView({
      collectionConfig,
      config,
      docPermissions,
      globalConfig,
      routeSegments: segments,
    }))
  }

  if (!View) {
    View = NotFoundView
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

  let id = idFromArgs

  if (shouldAutosave && !validateDraftData && !idFromArgs && collectionSlug) {
    doc = await payload.create({
      collection: collectionSlug,
      data: initialData || {},
      depth: 0,
      draft: true,
      fallbackLocale: false,
      locale: locale?.code,
      req,
      user,
    })

    if (doc?.id) {
      id = doc.id
      isEditing = getIsEditing({ id: doc.id, collectionSlug, globalSlug })

      if (!drawerSlug && redirectAfterCreate !== false) {
        const redirectURL = formatAdminURL({
          adminRoute,
          path: `/collections/${collectionSlug}/${doc.id}`,
          serverURL,
        })

        redirect(redirectURL)
      }
    } else {
      throw new Error('not-found')
    }
  }

  const documentSlots = renderDocumentSlots({
    id,
    collectionConfig,
    globalConfig,
    hasSavePermission,
    permissions: docPermissions,
    req,
  })

  const clientProps: DocumentViewClientProps = {
    formState,
    ...documentSlots,
    documentSubViewType,
    viewType,
  }

  const { isLivePreviewEnabled, livePreviewConfig, livePreviewURL } = await handleLivePreview({
    collectionSlug,
    config,
    data: doc,
    globalSlug,
    operation,
    req,
  })

  return {
    data: doc,
    Document: (
      <DocumentInfoProvider
        apiURL={apiURL}
        collectionSlug={collectionConfig?.slug}
        currentEditor={currentEditor}
        disableActions={disableActions ?? false}
        docPermissions={docPermissions}
        globalSlug={globalConfig?.slug}
        hasPublishedDoc={hasPublishedDoc}
        hasPublishPermission={hasPublishPermission}
        hasSavePermission={hasSavePermission}
        id={id}
        initialData={doc}
        initialState={formState}
        isEditing={isEditing}
        isLocked={isLocked}
        isTrashed={isTrashedDoc}
        key={locale?.code}
        lastUpdateTime={lastUpdateTime}
        mostRecentVersionIsAutosaved={mostRecentVersionIsAutosaved}
        redirectAfterCreate={redirectAfterCreate}
        redirectAfterDelete={redirectAfterDelete}
        redirectAfterDuplicate={redirectAfterDuplicate}
        redirectAfterRestore={redirectAfterRestore}
        unpublishedVersionCount={unpublishedVersionCount}
        versionCount={versionCount}
      >
        <LivePreviewProvider
          breakpoints={livePreviewConfig?.breakpoints}
          isLivePreviewEnabled={isLivePreviewEnabled && operation !== 'create'}
          isLivePreviewing={entityPreferences?.value?.editViewType === 'live-preview'}
          typeofLivePreviewURL={typeof livePreviewConfig?.url as 'function' | 'string' | undefined}
          url={livePreviewURL}
        >
          {showHeader && !drawerSlug && (
            <DocumentHeader
              collectionConfig={collectionConfig}
              globalConfig={globalConfig}
              permissions={permissions}
              req={req}
            />
          )}
          <HydrateAuthProvider permissions={permissions} />
          <EditDepthProvider>
            {RenderServerComponent({
              clientProps,
              Component: View,
              importMap,
              serverProps: documentViewServerProps,
            })}
          </EditDepthProvider>
        </LivePreviewProvider>
      </DocumentInfoProvider>
    ),
  }
}

export async function Document(props: AdminViewServerProps) {
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
