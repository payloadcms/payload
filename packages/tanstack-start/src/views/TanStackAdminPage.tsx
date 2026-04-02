'use client'

import type { ListQuery } from 'payload'

import {
  AccountClient,
  AdminNavLinks,
  APIViewClient,
  DefaultEditView,
  DocumentInfoProvider,
  EditDepthProvider,
  Gutter,
  HydrateAuthProvider,
  LivePreviewProvider,
  LoadingOverlay,
  OperationProvider,
  PageConfigProvider,
  parseSearchParams,
  useRouter,
  useSearchParams,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import { FormHeader } from '@payloadcms/ui/elements/FormHeader'
import { EntityType, groupNavItems } from '@payloadcms/ui/shared'
import { DefaultTemplateShell } from '@payloadcms/ui/templates/Default'
import { MinimalTemplate } from '@payloadcms/ui/templates/Minimal'
import { notFound } from '@tanstack/react-router'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { TanStackDocumentStateResult } from './Root/serverFunctions.js'
import type { SerializablePageState } from './Root/types.js'

import { buildRenderDocumentArgs, buildRenderListArgs } from './buildRenderViewArgs.js'
import { getAuthViewByType } from './getAuthViewByType.js'
import { getDashboardViewByType } from './getDashboardViewByType.js'

const getRedirectURL = (error: unknown): null | string => {
  if (!error || typeof error !== 'object') {
    return null
  }

  if ('href' in error && typeof error.href === 'string') {
    return error.href
  }

  if ('to' in error && typeof error.to === 'string') {
    return error.to
  }

  return null
}

const isNotFoundError = (error: unknown): boolean =>
  error instanceof Error && error.message === 'not-found'

function TanStackDefaultTemplate({
  children,
  pageState,
}: {
  children: React.ReactNode
  pageState: SerializablePageState
}) {
  const { i18n } = useTranslation()

  const groups = React.useMemo(
    () =>
      groupNavItems(
        [
          ...pageState.clientConfig.collections
            .filter((collection) => pageState.visibleEntities.collections.includes(collection.slug))
            .map((entity) => ({
              type: EntityType.collection,
              entity: entity as never,
            })),
          ...pageState.clientConfig.globals
            .filter((global) => pageState.visibleEntities.globals.includes(global.slug))
            .map((entity) => ({
              type: EntityType.global,
              entity: entity as never,
            })),
        ],
        pageState.permissions,
        i18n,
      ),
    [
      i18n,
      pageState.clientConfig.collections,
      pageState.clientConfig.globals,
      pageState.permissions,
      pageState.visibleEntities.collections,
      pageState.visibleEntities.globals,
    ],
  )

  return (
    <DefaultTemplateShell
      actions={{}}
      collectionSlug={pageState.routeParams.collection}
      Nav={
        <aside className="template-default__nav">
          <nav className="nav__wrap">
            <AdminNavLinks groups={groups} navPreferences={pageState.navPreferences} />
          </nav>
        </aside>
      }
      visibleEntities={pageState.visibleEntities}
    >
      {children}
    </DefaultTemplateShell>
  )
}

function UnsupportedView(props: { description: string; title: string }) {
  return (
    <Gutter>
      <FormHeader description={props.description} heading={props.title} />
    </Gutter>
  )
}

function ListView({ pageState }: { pageState: SerializablePageState }) {
  const { serverFunction } = useServerFunctions()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isNotFoundRoute, setIsNotFoundRoute] = React.useState(false)
  const [listView, setListView] = React.useState<null | React.ReactNode>(null)

  if (isNotFoundRoute) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound()
  }

  React.useEffect(() => {
    if (!pageState.routeParams.collection) {
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        const result = (await serverFunction({
          name: 'render-list',
          args: buildRenderListArgs({
            pageState,
            query: parseSearchParams(searchParams) as ListQuery,
          }),
        })) as { List?: React.ReactNode }

        if (!cancelled) {
          setListView(result?.List ?? null)
          setIsLoading(false)
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        const redirectURL = getRedirectURL(error)

        if (redirectURL) {
          router.replace(redirectURL)
          return
        }

        if (isNotFoundError(error)) {
          setIsNotFoundRoute(true)
          return
        }

        setListView(
          <UnsupportedView
            description="TanStack list view failed to render."
            title="Unsupported View"
          />,
        )
        setIsLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [pageState, router, searchParams, serverFunction])

  if (!pageState.routeParams.collection || isLoading) {
    return <LoadingOverlay />
  }

  return listView
}

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

function AccountView({ pageState }: { pageState: SerializablePageState }) {
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

function DocumentView({ pageState }: { pageState: SerializablePageState }) {
  const { renderDocument } = useServerFunctions()
  const router = useRouter()
  const [documentView, setDocumentView] = React.useState<null | React.ReactNode>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isNotFoundRoute, setIsNotFoundRoute] = React.useState(false)

  if (isNotFoundRoute) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw notFound()
  }

  React.useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const result = await renderDocument(
          buildRenderDocumentArgs({
            pageState,
          }),
        )

        if (cancelled) {
          return
        }

        if (
          pageState.routeParams.collection &&
          !pageState.routeParams.id &&
          result?.data &&
          typeof result.data === 'object' &&
          'id' in result.data &&
          result.data.id
        ) {
          router.replace(
            formatAdminURL({
              adminRoute: pageState.clientConfig.routes.admin,
              path: `/collections/${pageState.routeParams.collection}/${String(result.data.id)}`,
            }),
          )
          return
        }

        setDocumentView(result?.Document ?? null)
        setIsLoading(false)
      } catch (error) {
        if (cancelled) {
          return
        }

        const redirectURL = getRedirectURL(error)

        if (redirectURL) {
          router.replace(redirectURL)
          return
        }

        if (isNotFoundError(error)) {
          setIsNotFoundRoute(true)
          return
        }

        setDocumentView(
          <UnsupportedView
            description="TanStack document view failed to render."
            title="Unsupported View"
          />,
        )
        setIsLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [pageState, renderDocument, router])

  if (isLoading) {
    return <LoadingOverlay />
  }

  return documentView
}

function renderView(pageState: SerializablePageState): React.ReactNode {
  if (pageState.unsupportedCustomView || pageState.customView) {
    return (
      <UnsupportedView
        description="Custom TanStack admin views are not yet supported in the client-rendered path."
        title="Unsupported View"
      />
    )
  }

  const AuthView = getAuthViewByType(pageState.viewType)

  if (AuthView) {
    return <AuthView pageState={pageState} />
  }

  const DashboardView = getDashboardViewByType(pageState.viewType)

  if (DashboardView) {
    return <DashboardView pageState={pageState} />
  }

  switch (pageState.viewType as string | undefined) {
    case 'account':
      return <AccountView pageState={pageState} />
    case 'document':
      return <DocumentView pageState={pageState} />
    case 'list':
    case 'trash':
      return <ListView pageState={pageState} />
    default:
      return (
        <UnsupportedView
          description="This admin route has not been migrated to the TanStack client-rendered path yet."
          title="Unsupported View"
        />
      )
  }
}

export function TanStackAdminPage({ pageState }: { pageState: SerializablePageState }) {
  const content = renderView(pageState)

  return (
    <PageConfigProvider config={pageState.clientConfig}>
      {!pageState.templateType && <>{content}</>}
      {pageState.templateType === 'minimal' && (
        <MinimalTemplate className={pageState.templateClassName}>{content}</MinimalTemplate>
      )}
      {pageState.templateType === 'default' && (
        <TanStackDefaultTemplate pageState={pageState}>{content}</TanStackDefaultTemplate>
      )}
    </PageConfigProvider>
  )
}
