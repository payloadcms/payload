'use client'

import {
  AccountClient,
  APIViewClient,
  DefaultEditView,
  DocumentInfoProvider,
  EditDepthProvider,
  HydrateAuthProvider,
  LivePreviewProvider,
  LoadingOverlay,
  OperationProvider,
  useRouter,
  useServerFunctions,
} from '@payloadcms/ui'
import React from 'react'

import type { TanStackDocumentStateResult } from '../Root/serverFunctions.js'
import type { SerializablePageState } from '../Root/types.js'

import { UnsupportedView } from '../shared.js'

function useAccountDocumentState(args: { pageState: SerializablePageState }) {
  const { serverFunction } = useServerFunctions()
  const router = useRouter()
  const [state, setState] = React.useState<null | TanStackDocumentStateResult>(null)

  React.useEffect(() => {
    let cancelled = false

    const run = async () => {
      const result = (await serverFunction({
        name: 'tanstack-document-state',
        args: {
          account: true,
          collectionSlug: args.pageState.routeParams.collection,
          docID: args.pageState.routeParams.id,
          documentSubViewType: args.pageState.documentSubViewType,
          globalSlug: args.pageState.routeParams.global,
          searchParams: args.pageState.searchParams,
          segments: args.pageState.segments,
        },
      })) as TanStackDocumentStateResult

      if (result?.redirectURL) {
        router.replace(result.redirectURL)
        return
      }

      if (!cancelled) {
        setState(result)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [
    args.pageState.documentSubViewType,
    args.pageState.routeParams.collection,
    args.pageState.routeParams.global,
    args.pageState.routeParams.id,
    args.pageState.searchParams,
    args.pageState.segments,
    router,
    serverFunction,
  ])

  return state
}

export function AccountView({ pageState }: { pageState: SerializablePageState }) {
  const documentState = useAccountDocumentState({ pageState })

  if (!documentState) {
    return <LoadingOverlay />
  }

  if (pageState.documentSubViewType === 'versions' || pageState.documentSubViewType === 'version') {
    return (
      <UnsupportedView
        description="TanStack document version subviews have not been migrated yet."
        title="Unsupported View"
      />
    )
  }

  const operation =
    (documentState.collectionSlug && documentState.id) || documentState.globalSlug
      ? 'update'
      : 'create'

  return (
    <DocumentInfoProvider
      apiURL={documentState.apiURL}
      collectionSlug={documentState.collectionSlug}
      currentEditor={documentState.currentEditor as never}
      docPermissions={documentState.docPermissions as never}
      globalSlug={documentState.globalSlug}
      hasDeletePermission={documentState.hasDeletePermission}
      hasPublishedDoc={documentState.hasPublishedDoc}
      hasPublishPermission={documentState.hasPublishPermission}
      hasSavePermission={documentState.hasSavePermission}
      hasTrashPermission={documentState.hasTrashPermission}
      id={documentState.id}
      initialData={documentState.initialData}
      initialState={documentState.initialState}
      isEditing={documentState.isEditing}
      isLocked={documentState.isLocked}
      isTrashed={documentState.isTrashed}
      key={pageState.locale?.code}
      lastUpdateTime={documentState.lastUpdateTime}
      mostRecentVersionIsAutosaved={documentState.mostRecentVersionIsAutosaved}
      unpublishedVersionCount={documentState.unpublishedVersionCount}
      versionCount={documentState.versionCount}
    >
      <LivePreviewProvider
        breakpoints={documentState.livePreviewBreakpoints as never}
        isLivePreviewEnabled={documentState.isLivePreviewEnabled}
        isLivePreviewing={false}
        isPreviewEnabled={documentState.isPreviewEnabled}
        previewURL={documentState.previewURL}
        typeofLivePreviewURL={documentState.typeofLivePreviewURL}
        url={documentState.livePreviewURL}
      >
        <EditDepthProvider>
          <HydrateAuthProvider permissions={pageState.permissions} />
          <OperationProvider operation={operation}>
            {pageState.documentSubViewType === 'api' ? (
              <APIViewClient />
            ) : (
              <DefaultEditView
                documentSubViewType={pageState.documentSubViewType ?? 'default'}
                formState={documentState.initialState as never}
                viewType="account"
              />
            )}
          </OperationProvider>
          <AccountClient />
        </EditDepthProvider>
      </LivePreviewProvider>
    </DocumentInfoProvider>
  )
}
