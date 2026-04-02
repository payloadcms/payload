'use client'

import type { Column } from 'payload'

import {
  AccountClient,
  ActionsProvider,
  APIViewClient,
  AppHeader,
  BulkUploadProvider,
  Button,
  CreateFirstUserClient,
  DefaultEditView,
  DefaultListView,
  DocumentInfoProvider,
  EditDepthProvider,
  EntityVisibilityProvider,
  ForgotPasswordForm,
  Gutter,
  HydrateAuthProvider,
  Link,
  ListQueryProvider,
  LivePreviewProvider,
  LoadingOverlay,
  LoginForm,
  LogoutClient,
  OperationProvider,
  PageConfigProvider,
  parseSearchParams,
  ResetPasswordForm,
  useConfig,
  useRouter,
  useSearchParams,
  useServerFunctions,
  useStepNav,
  useTranslation,
} from '@payloadcms/ui'
import { FormHeader } from '@payloadcms/ui/elements/FormHeader'
import { EntityType, groupNavItems } from '@payloadcms/ui/shared'
import { MinimalTemplate } from '@payloadcms/ui/templates/Minimal'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { TanStackDocumentStateResult } from './Root/serverFunctions.js'
import type { SerializablePageState } from './Root/types.js'

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
    <EntityVisibilityProvider visibleEntities={pageState.visibleEntities}>
      <BulkUploadProvider drawerSlugPrefix={pageState.routeParams.collection}>
        <ActionsProvider Actions={{}}>
          <div className="template-default template-default--tanstack">
            <aside className="template-default__nav">
              {groups.map((group) => (
                <div className="template-default__nav-group" key={group.label}>
                  <div className="template-default__nav-label">{group.label}</div>
                  {group.entities.map((entity) => (
                    <Link
                      href={formatAdminURL({
                        adminRoute: pageState.clientConfig.routes.admin,
                        path:
                          entity.type === EntityType.collection
                            ? `/collections/${entity.slug}`
                            : `/globals/${entity.slug}`,
                      })}
                      key={`${entity.type}-${entity.slug}`}
                      prefetch={false}
                    >
                      {typeof entity.label === 'function'
                        ? entity.label({ i18n, t: i18n.t })
                        : entity.label}
                    </Link>
                  ))}
                </div>
              ))}
            </aside>
            <div className="template-default__wrap">
              <AppHeader />
              {children}
            </div>
          </div>
        </ActionsProvider>
      </BulkUploadProvider>
    </EntityVisibilityProvider>
  )
}

function UnsupportedView(props: { description: string; title: string }) {
  return (
    <Gutter>
      <FormHeader description={props.description} heading={props.title} />
    </Gutter>
  )
}

function DashboardView({ pageState }: { pageState: SerializablePageState }) {
  const { i18n, t } = useTranslation()
  const { setStepNav } = useStepNav()

  React.useEffect(() => {
    setStepNav([])
  }, [setStepNav])

  return (
    <Gutter className="dashboard">
      <h1>{t('general:dashboard')}</h1>
      <div className="dashboard__card-list">
        {pageState.clientConfig.collections
          .filter((collection) => pageState.visibleEntities.collections.includes(collection.slug))
          .filter((collection) => pageState.permissions.collections?.[collection.slug]?.read)
          .map((collection) => (
            <Link
              href={formatAdminURL({
                adminRoute: pageState.clientConfig.routes.admin,
                path: `/collections/${collection.slug}`,
              })}
              key={collection.slug}
              prefetch={false}
            >
              {typeof collection.labels.plural === 'function'
                ? collection.labels.plural({ i18n, t: i18n.t })
                : collection.labels.plural}
            </Link>
          ))}
        {pageState.clientConfig.globals
          .filter((global) => pageState.visibleEntities.globals.includes(global.slug))
          .filter((global) => pageState.permissions.globals?.[global.slug]?.read)
          .map((global) => (
            <Link
              href={formatAdminURL({
                adminRoute: pageState.clientConfig.routes.admin,
                path: `/globals/${global.slug}`,
              })}
              key={global.slug}
              prefetch={false}
            >
              {typeof global.label === 'function'
                ? global.label({ i18n, t: i18n.t })
                : global.label}
            </Link>
          ))}
      </div>
    </Gutter>
  )
}

function LoginView({ pageState }: { pageState: SerializablePageState }) {
  return (
    <div className="login">
      <LoginForm
        prefillEmail={pageState.pageData?.login?.prefillEmail}
        prefillPassword={pageState.pageData?.login?.prefillPassword}
        prefillUsername={pageState.pageData?.login?.prefillUsername}
        searchParams={pageState.searchParams}
      />
    </div>
  )
}

function ForgotPasswordView({ pageState }: { pageState: SerializablePageState }) {
  const { t } = useTranslation()

  return (
    <>
      <ForgotPasswordForm />
      <Link
        href={formatAdminURL({
          adminRoute: pageState.clientConfig.routes.admin,
          path: pageState.clientConfig.admin.routes.login,
        })}
        prefetch={false}
      >
        {t('authentication:backToLogin')}
      </Link>
    </>
  )
}

function ResetPasswordView({ pageState }: { pageState: SerializablePageState }) {
  const { t } = useTranslation()

  return (
    <div className="reset-password__wrap">
      <FormHeader heading={t('authentication:resetPassword')} />
      <ResetPasswordForm token={String(pageState.routeParams.token || '')} />
    </div>
  )
}

function UnauthorizedView({ pageState }: { pageState: SerializablePageState }) {
  const { t } = useTranslation()

  return (
    <Gutter className="unauthorized unauthorized--with-gutter">
      <FormHeader
        description={t('error:notAllowedToAccessPage')}
        heading={t('error:unauthorized')}
      />
      <Button
        className="unauthorized__button"
        el="link"
        size="large"
        to={formatAdminURL({
          adminRoute: pageState.clientConfig.routes.admin,
          path: pageState.clientConfig.admin.routes.logout,
        })}
      >
        {t('authentication:logOut')}
      </Button>
    </Gutter>
  )
}

function LogoutView({ pageState }: { pageState: SerializablePageState }) {
  return (
    <div className="logout">
      <LogoutClient
        adminRoute={pageState.clientConfig.routes.admin}
        inactivity={pageState.segments[0] === 'inactivity'}
        redirect={String(pageState.searchParams?.redirect || '')}
      />
    </div>
  )
}

function VerifyView({ pageState }: { pageState: SerializablePageState }) {
  return (
    <Gutter>
      <h2>{pageState.pageData?.verify?.message}</h2>
    </Gutter>
  )
}

function CreateFirstUserView({ pageState }: { pageState: SerializablePageState }) {
  const { t } = useTranslation()
  const data = pageState.pageData?.createFirstUser

  if (!data) {
    return <LoadingOverlay />
  }

  return (
    <div className="create-first-user">
      <h1>{t('general:welcome')}</h1>
      <p>{t('authentication:beginCreateFirstUser')}</p>
      <CreateFirstUserClient
        docPermissions={data.docPermissions as never}
        docPreferences={data.docPreferences as never}
        initialState={data.initialState as never}
        loginWithUsername={data.loginWithUsername as never}
        userSlug={data.userSlug}
      />
    </div>
  )
}

function useListState(pageState: SerializablePageState) {
  const { serverFunction } = useServerFunctions()
  const searchParams = useSearchParams()
  const [state, setState] = React.useState<{
    data: null | Record<string, unknown>
    renderedFilters?: Map<string, React.ReactNode>
    state: Column[]
    Table: React.ReactNode
  } | null>(null)

  React.useEffect(() => {
    if (!pageState.routeParams.collection) {
      return
    }

    let cancelled = false

    const run = async () => {
      const result = (await serverFunction({
        name: 'table-state',
        args: {
          collectionSlug: pageState.routeParams.collection,
          enableRowSelections: true,
          orderableFieldName: '_order',
          permissions: pageState.permissions,
          query: parseSearchParams(searchParams) as Record<string, unknown>,
        },
      })) as typeof state

      if (!cancelled) {
        setState(result)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [pageState.permissions, pageState.routeParams.collection, searchParams, serverFunction])

  return state
}

function ListView({ pageState }: { pageState: SerializablePageState }) {
  const { getEntityConfig } = useConfig()
  const searchParams = useSearchParams()
  const listState = useListState(pageState)

  if (!pageState.routeParams.collection || !listState) {
    return <LoadingOverlay />
  }

  const collectionSlug = pageState.routeParams.collection
  const collectionConfig = getEntityConfig({ collectionSlug })
  const query = parseSearchParams(searchParams) as Record<string, unknown>

  return (
    <>
      <HydrateAuthProvider permissions={pageState.permissions} />
      <ListQueryProvider
        collectionSlug={collectionSlug}
        data={listState.data}
        modifySearchParams
        orderableFieldName={collectionConfig?.orderable === true ? '_order' : undefined}
        query={{
          limit: typeof query.limit === 'number' ? query.limit : listState.data?.limit,
          sort: typeof query.sort === 'string' ? query.sort : undefined,
        }}
      >
        <DefaultListView
          collectionSlug={collectionSlug}
          columnState={listState.state}
          hasCreatePermission={Boolean(pageState.permissions.collections?.[collectionSlug]?.create)}
          hasDeletePermission={pageState.permissions.collections?.[collectionSlug]?.delete}
          hasTrashPermission={pageState.permissions.collections?.[collectionSlug]?.delete}
          newDocumentURL={formatAdminURL({
            adminRoute: pageState.clientConfig.routes.admin,
            path: `/collections/${collectionSlug}/create`,
          })}
          renderedFilters={listState.renderedFilters}
          Table={listState.Table}
          viewType={pageState.viewType}
        />
      </ListQueryProvider>
    </>
  )
}

function useDocumentState(args: { account?: boolean; pageState: SerializablePageState }) {
  const { serverFunction } = useServerFunctions()
  const router = useRouter()
  const [state, setState] = React.useState<null | TanStackDocumentStateResult>(null)

  React.useEffect(() => {
    let cancelled = false

    const run = async () => {
      const result = (await serverFunction({
        name: 'tanstack-document-state',
        args: {
          account: args.account,
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
    args.account,
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

function DocumentView({
  account,
  pageState,
}: {
  account?: boolean
  pageState: SerializablePageState
}) {
  const documentState = useDocumentState({ account, pageState })

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
            {pageState.documentSubViewType === 'api' ? <APIViewClient /> : <DefaultEditView />}
          </OperationProvider>
          {account && <AccountClient />}
        </EditDepthProvider>
      </LivePreviewProvider>
    </DocumentInfoProvider>
  )
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

  switch (pageState.viewType as string | undefined) {
    case 'account':
      return <DocumentView account pageState={pageState} />
    case 'createFirstUser':
      return <CreateFirstUserView pageState={pageState} />
    case 'dashboard':
      return <DashboardView pageState={pageState} />
    case 'document':
      return <DocumentView pageState={pageState} />
    case 'forgot':
      return <ForgotPasswordView pageState={pageState} />
    case 'inactivity':
    case 'logout':
      return <LogoutView pageState={pageState} />
    case 'list':
    case 'trash':
      return <ListView pageState={pageState} />
    case 'login':
      return <LoginView pageState={pageState} />
    case 'reset':
      return <ResetPasswordView pageState={pageState} />
    case 'unauthorized':
      return <UnauthorizedView pageState={pageState} />
    case 'verify':
      return <VerifyView pageState={pageState} />
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
