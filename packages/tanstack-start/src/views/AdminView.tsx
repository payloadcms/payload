'use client'

import type { NavGroupType } from '@payloadcms/ui/shared'
import type { SerializableDocumentViewData } from '@payloadcms/ui/views/Document/buildDocumentViewClientProps'
import type { SerializableListViewData } from '@payloadcms/ui/views/List/buildListViewClientProps'
import type {
  AdminViewClientProps,
  FormState,
  Locale,
  NavPreferences,
  SanitizedPermissions,
  VisibleEntities,
} from 'payload'

import {
  DefaultEditView,
  DefaultListView,
  DocumentInfoProvider,
  EditDepthProvider,
  Gutter,
  HydrateAuthProvider,
  ImportMapProvider,
  ListQueryProvider,
  LivePreviewProvider,
  PageConfigProvider,
  useConfig,
  useTranslation,
} from '@payloadcms/ui'
import { DefaultNav } from '@payloadcms/ui/elements/Nav'
import { DefaultTemplate } from '@payloadcms/ui/templates/Default'
import { MinimalTemplate } from '@payloadcms/ui/templates/Minimal'
import { renderFilters, renderTable } from '@payloadcms/ui/utilities/renderTable'
import { APIViewClient } from '@payloadcms/ui/views/API/index.client'
import { CreateFirstUserClient } from '@payloadcms/ui/views/CreateFirstUser/index.client'
import { DashboardView } from '@payloadcms/ui/views/Dashboard'
import { DefaultDashboard } from '@payloadcms/ui/views/Dashboard/Default'
import { buildDocumentViewClientProps } from '@payloadcms/ui/views/Document/buildDocumentViewClientProps'
import { buildListViewClientProps } from '@payloadcms/ui/views/List/buildListViewClientProps'
import { LoginForm } from '@payloadcms/ui/views/Login/LoginForm'
import { LogoutClient } from '@payloadcms/ui/views/Logout/LogoutClient'
import { buildVersionColumns } from '@payloadcms/ui/views/Versions/buildColumns'
import { VersionsViewClient } from '@payloadcms/ui/views/Versions/index.client'
import { CollectionCardsClient } from '@payloadcms/ui/widgets/CollectionCards/index.client'
import { useLocation } from '@tanstack/react-router'
import { getFromImportMap } from 'payload/shared'
import React from 'react'

import type {
  SerializableCreateFirstUserData,
  SerializableDashboardData,
  SerializableLoginData,
  SerializableRouteData,
  SerializableVersionsData,
} from './Root/index.js'

import { DocumentHeaderClient } from '../elements/DocumentHeaderClient/index.js'

export type AdminViewProps = {
  createFirstUserData?: SerializableCreateFirstUserData
  dashboardData?: SerializableDashboardData
  documentData?: SerializableDocumentViewData
  importMap: Record<string, unknown>
  listData?: SerializableListViewData
  locale: Locale
  loginData?: SerializableLoginData
  navGroups: NavGroupType[]
  navPreferences: NavPreferences
  permissions: SanitizedPermissions
  routeData: SerializableRouteData
  versionsData?: SerializableVersionsData
  viewProps: AdminViewClientProps
  visibleEntities: VisibleEntities
}

export function AdminView({
  createFirstUserData,
  dashboardData,
  documentData,
  importMap,
  listData,
  loginData,
  navGroups,
  navPreferences,
  permissions,
  routeData,
  versionsData,
  viewProps,
  visibleEntities,
}: AdminViewProps) {
  const { templateClassName, templateType } = routeData

  const ViewContent = (
    <React.Fragment>
      <HydrateAuthProvider permissions={permissions} />
      <ImportMapProvider value={importMap as any}>
        {viewProps.clientConfig && (
          <PageConfigProvider config={viewProps.clientConfig}>
            <ViewRenderer
              createFirstUserData={createFirstUserData}
              dashboardData={dashboardData}
              documentData={documentData}
              importMap={importMap}
              listData={listData}
              loginData={loginData}
              permissions={permissions}
              routeData={routeData}
              versionsData={versionsData}
              viewProps={viewProps}
            />
          </PageConfigProvider>
        )}
      </ImportMapProvider>
    </React.Fragment>
  )

  if (templateType === 'default') {
    return (
      <DefaultTemplate
        className={templateClassName}
        NavComponent={<DefaultNav groups={navGroups} navPreferences={navPreferences} />}
        visibleEntities={visibleEntities}
      >
        {ViewContent}
      </DefaultTemplate>
    )
  }

  if (templateType === 'minimal') {
    return <MinimalTemplate className={templateClassName}>{ViewContent}</MinimalTemplate>
  }

  return ViewContent
}

function ViewRenderer({
  createFirstUserData,
  dashboardData,
  documentData,
  importMap,
  listData,
  loginData,
  permissions,
  routeData,
  versionsData,
  viewProps,
}: {
  createFirstUserData?: SerializableCreateFirstUserData
  dashboardData?: SerializableDashboardData
  documentData?: SerializableDocumentViewData
  importMap: Record<string, unknown>
  listData?: SerializableListViewData
  loginData?: SerializableLoginData
  permissions: SanitizedPermissions
  routeData: SerializableRouteData
  versionsData?: SerializableVersionsData
  viewProps: AdminViewClientProps
}) {
  const { viewType } = viewProps

  if (routeData.templateClassName === 'login') {
    return <LoginViewContent loginData={loginData} />
  }

  switch (viewType) {
    case 'account':
      return (
        <DocumentViewContent
          documentData={documentData}
          importMap={importMap}
          permissions={permissions}
          routeData={routeData}
          versionsData={versionsData}
        />
      )
    case 'createFirstUser':
      return (
        <CreateFirstUserViewContent
          customViewComponent={routeData.customViewComponent}
          data={createFirstUserData}
          importMap={importMap}
        />
      )
    case 'dashboard':
      return <DashboardViewContent dashboardData={dashboardData} permissions={permissions} />
    case 'document':
    case 'version':
      return (
        <DocumentViewContent
          documentData={documentData}
          importMap={importMap}
          permissions={permissions}
          routeData={routeData}
          versionsData={versionsData}
        />
      )
    case 'inactivity':
    case 'logout':
      return (
        <LogoutViewContent
          adminRoute={viewProps.clientConfig?.routes?.admin ?? '/admin'}
          inactivity={viewType === 'inactivity'}
        />
      )
    case 'list':
    case 'trash':
      return (
        <ListViewContent
          importMap={importMap}
          listData={listData}
          permissions={permissions}
          viewProps={viewProps}
        />
      )
    default:
      return null
  }
}

function DashboardViewContent({
  dashboardData,
  permissions,
}: {
  dashboardData?: SerializableDashboardData
  permissions: SanitizedPermissions
}) {
  if (!dashboardData) {
    return null
  }

  if (dashboardData.userId == null) {
    return null
  }

  return (
    <DashboardView permissions={permissions}>
      <DefaultDashboard>
        <CollectionCardsClient
          adminRoute={dashboardData.adminRoute}
          globalData={dashboardData.globalData}
          navGroups={dashboardData.navGroups}
          permissions={dashboardData.permissions}
          userId={dashboardData.userId}
        />
      </DefaultDashboard>
    </DashboardView>
  )
}

function ListViewContent({
  importMap,
  listData,
  permissions,
  viewProps,
}: {
  importMap: Record<string, unknown>
  listData?: SerializableListViewData
  permissions: SanitizedPermissions
  viewProps: AdminViewClientProps
}) {
  const { i18n } = useTranslation()

  if (!listData || !viewProps.clientConfig) {
    return null
  }

  const listViewClientProps = buildListViewClientProps({
    clientConfig: viewProps.clientConfig,
    data: listData,
    i18n,
    importMap: importMap as any,
    permissions,
    renderFilters,
    renderTable,
  })

  return (
    <ListQueryProvider
      collectionSlug={listData.collectionSlug}
      data={listData.data}
      modifySearchParams={!listData.isInDrawer}
      orderableFieldName={listData.orderableFieldName}
      query={listData.query}
    >
      <DefaultListView {...listViewClientProps} />
    </ListQueryProvider>
  )
}

function DocumentViewContent({
  documentData,
  importMap,
  permissions,
  routeData,
  versionsData,
}: {
  documentData?: SerializableDocumentViewData
  importMap: Record<string, unknown>
  permissions: SanitizedPermissions
  routeData: SerializableRouteData
  versionsData?: SerializableVersionsData
}) {
  const { getEntityConfig } = useConfig()

  if (!documentData) {
    return null
  }

  const clientProps = buildDocumentViewClientProps(documentData)

  // Resolve custom live-preview component from the client-side import map.
  // In non-RSC adapters (like TanStack Start), the server cannot pre-render this
  // slot, so we look it up and render it entirely on the client.
  const entityConfig = documentData.collectionSlug
    ? getEntityConfig({ collectionSlug: documentData.collectionSlug })
    : documentData.globalSlug
      ? getEntityConfig({ globalSlug: documentData.globalSlug })
      : null
  const livePreviewComponentSpec = (entityConfig as any)?.admin?.components?.views?.edit
    ?.livePreview?.Component as string | undefined
  const CustomLivePreviewComponent = livePreviewComponentSpec
    ? getFromImportMap<React.ComponentType>({
        importMap: importMap as any,
        PayloadComponent: livePreviewComponentSpec,
        silent: true,
      })
    : undefined

  const livePreviewSlot = CustomLivePreviewComponent ? <CustomLivePreviewComponent /> : undefined

  const renderSubView = () => {
    switch (routeData.documentSubViewType) {
      case 'api':
        return <APIViewClient />
      case 'versions':
        return (
          <VersionsListViewContent
            collectionSlug={routeData.collectionSlug}
            globalSlug={routeData.globalSlug}
            id={routeData.routeParams.id}
            versionsData={versionsData}
          />
        )
      default:
        return <DefaultEditView {...clientProps} LivePreview={livePreviewSlot} />
    }
  }

  return (
    <DocumentInfoProvider
      apiURL={documentData.apiURL}
      collectionSlug={documentData.collectionSlug}
      currentEditor={documentData.currentEditor as any}
      disableActions={documentData.disableActions}
      docPermissions={documentData.docPermissions}
      globalSlug={documentData.globalSlug}
      hasDeletePermission={documentData.hasDeletePermission}
      hasPublishedDoc={documentData.hasPublishedDoc}
      hasPublishPermission={documentData.hasPublishPermission}
      hasSavePermission={documentData.hasSavePermission}
      hasTrashPermission={documentData.hasTrashPermission}
      id={documentData.id}
      initialData={documentData.doc}
      initialState={documentData.formState as FormState}
      isEditing={documentData.isEditing}
      isLocked={documentData.isLocked}
      isTrashed={documentData.isTrashedDoc}
      key={`${documentData.id ?? 'create'}-${documentData.locale?.code}`}
      lastUpdateTime={documentData.lastUpdateTime ?? 0}
      mostRecentVersionIsAutosaved={documentData.mostRecentVersionIsAutosaved}
      unpublishedVersionCount={documentData.unpublishedVersionCount}
      versionCount={documentData.versionCount ?? 0}
    >
      <LivePreviewProvider
        breakpoints={documentData.livePreviewBreakpoints}
        isLivePreviewEnabled={documentData.isLivePreviewEnabled}
        isLivePreviewing={Boolean(
          documentData.entityPreferences?.value?.editViewType === 'live-preview' &&
            documentData.livePreviewURL,
        )}
        isPreviewEnabled={documentData.isPreviewEnabled}
        previewURL={documentData.previewURL}
        typeofLivePreviewURL={documentData.typeofLivePreviewURL}
        url={documentData.livePreviewURL}
      >
        {documentData.showHeader && (
          <DocumentHeaderClient
            collectionSlug={documentData.collectionSlug}
            globalSlug={documentData.globalSlug}
            importMap={importMap as any}
          />
        )}
        <HydrateAuthProvider permissions={permissions} />
        <EditDepthProvider>{renderSubView()}</EditDepthProvider>
      </LivePreviewProvider>
    </DocumentInfoProvider>
  )
}

function CreateFirstUserViewContent({
  customViewComponent,
  data,
  importMap,
}: {
  customViewComponent?: SerializableRouteData['customViewComponent']
  data?: SerializableCreateFirstUserData
  importMap: Record<string, unknown>
}) {
  if (!data) {
    return null
  }

  const CustomView = customViewComponent
    ? getFromImportMap<React.ComponentType<{ data?: SerializableCreateFirstUserData }>>({
        importMap: importMap as any,
        PayloadComponent: customViewComponent,
        silent: true,
      })
    : null

  return (
    <div className="create-first-user">
      {CustomView && <CustomView data={data} />}
      <h1>{data.welcomeMessage}</h1>
      <p>{data.beginMessage}</p>
      <CreateFirstUserClient
        docPermissions={data.docPermissions}
        docPreferences={data.docPreferences}
        initialState={data.formState}
        loginWithUsername={data.loginWithUsername}
        userSlug={data.userSlug}
      />
    </div>
  )
}

function LogoutViewContent({
  adminRoute,
  inactivity,
}: {
  adminRoute: string
  inactivity?: boolean
}) {
  return (
    <div className="logout">
      <LogoutClient adminRoute={adminRoute} inactivity={inactivity} redirect="" />
    </div>
  )
}

function LoginViewContent({ loginData }: { loginData?: SerializableLoginData }) {
  const location = useLocation()

  if (!loginData) {
    return null
  }

  const searchParams = Object.fromEntries(new URLSearchParams(location.search))

  return (
    <React.Fragment>
      <div
        className="login__brand"
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 'calc(var(--base) * 2)',
          width: '100%',
        }}
      >
        <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>Payload</span>
      </div>
      {!loginData.isLocalStrategyDisabled && (
        <LoginForm
          prefillEmail={loginData.prefillEmail}
          prefillPassword={loginData.prefillPassword}
          prefillUsername={loginData.prefillUsername}
          searchParams={searchParams}
        />
      )}
    </React.Fragment>
  )
}

function VersionsListViewContent({
  id,
  collectionSlug,
  globalSlug,
  versionsData,
}: {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  versionsData?: SerializableVersionsData
}) {
  const { i18n } = useTranslation()
  const { getEntityConfig } = useConfig()

  if (!versionsData) {
    return null
  }

  const collectionConfig = getEntityConfig({ collectionSlug }) as any
  const globalConfig = getEntityConfig({ globalSlug }) as any

  const columns = buildVersionColumns({
    collectionConfig,
    currentlyPublishedVersion: versionsData.currentlyPublishedVersion ?? undefined,
    docID: id,
    docs: versionsData.versionsData?.docs,
    globalConfig,
    i18n: i18n as any,
    latestDraftVersion: versionsData.latestDraftVersion ?? undefined,
  })

  return (
    <main className="versions">
      <Gutter className="versions__wrap">
        <ListQueryProvider data={versionsData.versionsData} query={{}}>
          <VersionsViewClient
            baseClass="versions"
            columns={columns}
            fetchURL={versionsData.fetchURL}
            paginationLimits={versionsData.paginationLimits}
          />
        </ListQueryProvider>
      </Gutter>
    </main>
  )
}
