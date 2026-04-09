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
  HydrateAuthProvider,
  ImportMapProvider,
  ListQueryProvider,
  LivePreviewProvider,
  PageConfigProvider,
  useTranslation,
} from '@payloadcms/ui'
import { DefaultNav } from '@payloadcms/ui/elements/Nav'
import { DefaultTemplate } from '@payloadcms/ui/templates/Default'
import { MinimalTemplate } from '@payloadcms/ui/templates/Minimal'
import { CreateFirstUserClient } from '@payloadcms/ui/views/CreateFirstUser/index.client'
import { DashboardView } from '@payloadcms/ui/views/Dashboard'
import { DefaultDashboard } from '@payloadcms/ui/views/Dashboard/Default'
import { buildDocumentViewClientProps } from '@payloadcms/ui/views/Document/buildDocumentViewClientProps'
import { buildListViewClientProps } from '@payloadcms/ui/views/List/buildListViewClientProps'
import { LoginForm } from '@payloadcms/ui/views/Login/LoginForm'
import { CollectionCardsClient } from '@payloadcms/ui/widgets/CollectionCards/index.client'
import React from 'react'

import type {
  SerializableCreateFirstUserData,
  SerializableDashboardData,
  SerializableLoginData,
  SerializableRouteData,
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
  viewProps: AdminViewClientProps
}) {
  const { viewType } = viewProps

  if (routeData.templateClassName === 'login' || viewType === 'login') {
    return <LoginViewContent loginData={loginData} />
  }

  switch (viewType) {
    case 'createFirstUser':
      return <CreateFirstUserViewContent data={createFirstUserData} />
    case 'dashboard':
      return <DashboardViewContent dashboardData={dashboardData} permissions={permissions} />
    case 'document':
      return (
        <DocumentViewContent
          documentData={documentData}
          importMap={importMap}
          permissions={permissions}
          routeData={routeData}
        />
      )
    case 'list':
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
}: {
  documentData?: SerializableDocumentViewData
  importMap: Record<string, unknown>
  permissions: SanitizedPermissions
  routeData: SerializableRouteData
}) {
  if (!documentData) {
    return null
  }

  const clientProps = buildDocumentViewClientProps(documentData)

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
        <EditDepthProvider>
          <DefaultEditView {...clientProps} />
        </EditDepthProvider>
      </LivePreviewProvider>
    </DocumentInfoProvider>
  )
}

function CreateFirstUserViewContent({ data }: { data?: SerializableCreateFirstUserData }) {
  if (!data) {
    return null
  }

  return (
    <div className="create-first-user">
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

function LoginViewContent({ loginData }: { loginData?: SerializableLoginData }) {
  if (!loginData) {
    return null
  }

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
          searchParams={{}}
        />
      )}
    </React.Fragment>
  )
}
