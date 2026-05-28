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

import { isolateObjectProperty } from 'payload'
import { formatAdminURL, hasAutosaveEnabled, hasDraftsEnabled } from 'payload/shared'
import React from 'react'

import { DocumentHeader } from '../../elements/DocumentHeader/index.js'
import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import {
  DefaultEditView,
  DocumentInfoProvider,
  EditDepthProvider,
  HydrateAuthProvider,
  LivePreviewProvider,
  // eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
} from '../../exports/client/index.js'
import { buildFormState } from '../../utilities/buildFormState.js'
import { getPreferences } from '../../utilities/getPreferences.js'
import { handleLivePreview } from '../../utilities/handleLivePreview.js'
import { handlePreview } from '../../utilities/handlePreview.js'
import { isEditing as getIsEditing } from '../../utilities/isEditing.js'
import { NotFoundClient } from '../NotFound/index.client.js'
import { UnauthorizedViewWithGutter } from '../Unauthorized/index.js'
import { VersionViewRSC } from '../Version/VersionViewRSC.js'
import { VersionsViewRSC } from '../Versions/VersionsViewRSC.js'
import { getDocPreferences } from './getDocPreferences.js'
import { getDocumentData } from './getDocumentData.js'
import { getDocumentPermissions } from './getDocumentPermissions.js'
import { getDocumentView } from './getDocumentView.js'
import { getIsLocked } from './getIsLocked.js'
import { getVersions } from './getVersions.js'
import { renderDocumentSlots } from './renderDocumentSlots.js'

const NotFoundView = () => <NotFoundClient />

export type ViewToRender =
  | EditViewComponent
  | PayloadComponent<DocumentViewServerProps>
  | React.FC
  | React.FC<DocumentViewClientProps>

export type RenderDocumentArgs = {
  drawerSlug?: string
  overrideEntityVisibility?: boolean
  readonly redirectAfterCreate?: boolean
  readonly redirectAfterDelete?: boolean
  readonly redirectAfterDuplicate?: boolean
  readonly redirectAfterRestore?: boolean
  versions?: RenderDocumentVersionsProperties
} & AdminViewServerProps

/**
 * Framework-agnostic render-document worker. Resolves the document, its
 * permissions, lock state, versions, and form state, then picks + renders
 * the appropriate sub-view (edit / version / versions / not-found) wrapped
 * in the standard providers.
 *
 * Throws:
 *  - `Error('not-found')` for hard 404s (no permissions, no doc, etc.)
 *  - `Error('redirect:<url>')` for soft redirects (autosave create flow,
 *    not-found-on-edit fallbacks)
 *
 * The framework adapter is responsible for translating these errors into
 * `notFound()` / `redirect()` calls.
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
}: RenderDocumentArgs): Promise<{
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
    if (collectionSlug) {
      const redirectURL = formatAdminURL({
        adminRoute,
        path: `/collections/${collectionSlug}?notFound=${encodeURIComponent(idFromArgs)}`,
      })
      throw new Error(`redirect:${redirectURL}`)
    } else {
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
    getDocPreferences({
      id: idFromArgs,
      collectionSlug,
      globalSlug,
      payload,
      user,
    }),
    getDocumentPermissions({
      id: idFromArgs,
      collectionConfig,
      data: doc,
      globalConfig,
      req: reqForPermissions,
    }),
    getIsLocked({
      id: idFromArgs,
      collectionConfig,
      globalConfig,
      isEditing,
      req: reqForLockCheck,
    }),
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
      defaultViews: {
        edit: DefaultEditView,
        version: VersionViewRSC,
        versions: VersionsViewRSC,
      },
      docPermissions,
      globalConfig,
      routeSegments: segments,
    }) as { View: ViewToRender })

    if (View === UnauthorizedViewWithGutter) {
      showHeader = false
    }
  }

  if (!View) {
    View = NotFoundView
  }

  /**
   * Handle autosave-on-create: create the doc and redirect to its admin URL.
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
        throw new Error(`redirect:${redirectURL}`)
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
    renderComponent: RenderServerComponent,
    req,
  })

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
              importMap,
              serverProps: documentViewServerProps,
            })}
          </EditDepthProvider>
        </LivePreviewProvider>
      </DocumentInfoProvider>
    ),
  }
}

/**
 * Framework-agnostic Document view RSC. Wraps `renderDocument` and returns
 * just the React node — the framework adapter handles error translation.
 */
export const DocumentViewRSC = async (props: AdminViewServerProps) => {
  const { Document } = await renderDocument(props)
  return Document
}
