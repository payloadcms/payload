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
import { handleLivePreview, handlePreview } from '@payloadcms/ui/rsc'
import { isEditing as getIsEditing } from '@payloadcms/ui/shared'
import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import { notFound, redirect } from 'next/navigation.js'
import { isolateObjectProperty, logError } from 'payload'
import { formatAdminURL, hasAutosaveEnabled, hasDraftsEnabled } from 'payload/shared'
import React from 'react'

import type { GenerateEditViewMetadata } from './getMetaBySegment.js'

import { DocumentHeader } from '../../elements/DocumentHeader/index.js'
import { getAdminConfig } from '../../utilities/adminConfigCache.js'
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
      })
      redirect(redirectURL)
    } else {
      // For globals or other cases, keep the 404 behavior
      throw new Error('not-found')
    }
  }

  const isTrashedDoc = Boolean(doc && 'deletedAt' in doc && typeof doc?.deletedAt === 'string')

  // CRITICAL FIX FOR TRANSACTION RACE CONDITION:
  // When running parallel operations with Promise.all, if they share the same req object
  // and one operation calls initTransaction() which MUTATES req.transactionID, that mutation
  // is visible to all parallel operations. This causes:
  // 1. Operation A (e.g., getDocumentPermissions → docAccessOperation) calls initTransaction()
  //    which sets req.transactionID = Promise, then resolves it to a UUID
  // 2. Operation B (e.g., getIsLocked) running in parallel receives the SAME req with the mutated transactionID
  // 3. Operation A (does not even know that Operation B even exists and is stil using the transactionID) commits/ends its transaction
  // 4. Operation B tries to use the now-expired session → MongoExpiredSessionError!
  //
  // Solution: Use isolateObjectProperty to create a Proxy that isolates the 'transactionID' property.
  // This allows each operation to have its own transactionID without affecting the parent req.
  // If parent req already has a transaction, preserve it (don't isolate), since this
  // issue only arises when one of the operations calls initTransaction() themselves -
  // because then, that operation will also try to commit/end the transaction itself.

  // If the transactionID is already set, the parallel operations will not try to
  // commit/end the transaction themselves, so we don't need to isolate the
  // transactionID property.
  const reqForPermissions = req.transactionID ? req : isolateObjectProperty(req, 'transactionID')
  const reqForLockCheck = req.transactionID ? req : isolateObjectProperty(req, 'transactionID')

  const [
    docPreferences,
    {
      docPermissions,
      hasDeletePermission,
      hasPublishPermission,
      hasSavePermission,
      hasTrashPermission,
    },
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

    // Get permissions - isolated transactionID prevents cross-contamination
    getDocumentPermissions({
      id: idFromArgs,
      collectionConfig,
      data: doc,
      globalConfig,
      req: reqForPermissions,
    }),

    // Fetch document lock state - isolated transactionID prevents cross-contamination
    getIsLocked({
      id: idFromArgs,
      collectionConfig,
      globalConfig,
      isEditing,
      req: reqForLockCheck,
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

  if (hasDraftsEnabled(collectionConfig || globalConfig)) {
    formattedParams.append('draft', 'true')
  }

  if (locale?.code) {
    formattedParams.append('locale', locale.code)
  }

  const apiQueryParams = `?${formattedParams.toString()}`

  const apiURL = formatAdminURL({
    apiRoute,
    path: collectionSlug
      ? `/${collectionSlug}/${idFromArgs}${apiQueryParams}`
      : globalSlug
        ? `/${globalSlug}${apiQueryParams}`
        : '',
  })

  let View: ViewToRender = null

  let showHeader = true

  const adminConfig = getAdminConfig()
  const collectionSlugForConfig = collectionConfig?.slug
  const globalSlugForConfig = globalConfig?.slug

  const adminCollectionEditRoot = collectionSlugForConfig
    ? (adminConfig.collections?.[collectionSlugForConfig] as any)?.views?.edit?.root?.Component
    : undefined
  const adminGlobalEditRoot = globalSlugForConfig
    ? (adminConfig.globals?.[globalSlugForConfig] as any)?.views?.edit?.root?.Component
    : undefined

  const RootViewOverride =
    adminCollectionEditRoot ??
    adminGlobalEditRoot ??
    (collectionConfig?.admin?.components?.views?.edit?.root &&
    'Component' in collectionConfig.admin.components.views.edit.root
      ? collectionConfig?.admin?.components?.views?.edit?.root?.Component
      : globalConfig?.admin?.components?.views?.edit?.root &&
          'Component' in globalConfig.admin.components.views.edit.root
        ? globalConfig?.admin?.components?.views?.edit?.root?.Component
        : null)

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
  const shouldAutosave = hasSavePermission && hasAutosaveEnabled(collectionConfig || globalConfig)

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
    locale,
    permissions,
    req,
  })

  // Extract Description from documentSlots to pass to DocumentHeader
  const { Description } = documentSlots

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

  const { isPreviewEnabled, previewURL } = await handlePreview({
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
        hasDeletePermission={hasDeletePermission}
        hasPublishedDoc={hasPublishedDoc}
        hasPublishPermission={hasPublishPermission}
        hasSavePermission={hasSavePermission}
        hasTrashPermission={hasTrashPermission}
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
          isLivePreviewing={Boolean(
            entityPreferences?.value?.editViewType === 'live-preview' && livePreviewURL,
          )}
          isPreviewEnabled={Boolean(isPreviewEnabled)}
          previewURL={previewURL}
          typeofLivePreviewURL={typeof livePreviewConfig?.url as 'function' | 'string' | undefined}
          url={livePreviewURL}
        >
          {showHeader && !drawerSlug && (
            <DocumentHeader
              AfterHeader={Description}
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
