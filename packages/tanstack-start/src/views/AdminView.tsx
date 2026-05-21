'use client'

import type { NavGroupType } from '@payloadcms/ui/shared'
import type { SerializableDocumentViewData } from '@payloadcms/ui/views/Document/buildDocumentViewClientProps'
import type { SerializableListViewData } from '@payloadcms/ui/views/List/buildListViewClientProps'
import type {
  AdminViewClientProps,
  ClientFieldSchemaMap,
  ComponentRenderer,
  FlattenedBlock,
  FormState,
  ImportMap,
  Locale,
  NavPreferences,
  PayloadComponent,
  SanitizedPermissions,
  TypeWithVersion,
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
import { RenderClientComponent } from '@payloadcms/ui/elements/RenderServerComponent/clientOnly'
import { formatDate } from '@payloadcms/ui/shared'
import { DefaultTemplate } from '@payloadcms/ui/templates/Default'
import { MinimalTemplate } from '@payloadcms/ui/templates/Minimal'
import { renderFilters, renderTable } from '@payloadcms/ui/utilities/renderTable'
import { AccountClient } from '@payloadcms/ui/views/Account/index.client'
import { APIViewClient } from '@payloadcms/ui/views/API/index.client'
import { CreateFirstUserClient } from '@payloadcms/ui/views/CreateFirstUser/index.client'
import { DashboardView } from '@payloadcms/ui/views/Dashboard'
import { DefaultDashboard } from '@payloadcms/ui/views/Dashboard/Default'
import { buildDocumentViewClientProps } from '@payloadcms/ui/views/Document/buildDocumentViewClientProps'
import { buildListViewClientProps } from '@payloadcms/ui/views/List/buildListViewClientProps'
import { LoginForm } from '@payloadcms/ui/views/Login/LoginForm'
import { LogoutClient } from '@payloadcms/ui/views/Logout/LogoutClient'
import { DefaultVersionView } from '@payloadcms/ui/views/Version/Default'
import { buildVersionFields } from '@payloadcms/ui/views/Version/RenderFieldsToDiff/buildVersionFields'
import { RenderVersionFieldsToDiff } from '@payloadcms/ui/views/Version/RenderFieldsToDiff/RenderVersionFieldsToDiff'
import { getVersionLabel } from '@payloadcms/ui/views/Version/VersionPillLabel/getVersionLabel'
import { VersionPillLabel } from '@payloadcms/ui/views/Version/VersionPillLabel/VersionPillLabel'
import { buildVersionColumns } from '@payloadcms/ui/views/Versions/buildColumns'
import { VersionsViewClient } from '@payloadcms/ui/views/Versions/index.client'
import { CollectionCardsClient } from '@payloadcms/ui/widgets/CollectionCards/index.client'
import { useLocation } from '@tanstack/react-router'
import { getFromImportMap, isPlainObject, isReactServerComponentOrFunction } from 'payload/shared'
import React, { useMemo } from 'react'

import type {
  SerializableCreateFirstUserData,
  SerializableDashboardData,
  SerializableLoginData,
  SerializableRouteData,
  SerializableVersionsData,
  SerializableVersionViewData,
} from './Root/index.js'

import { DocumentHeaderClient } from '../elements/DocumentHeaderClient/index.js'
import { AccountSettings } from './AccountSettings/index.js'

function removeUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T
}

const renderComponentWithServerProps: ComponentRenderer = ({
  clientProps = {},
  Component,
  Fallback,
  importMap,
  key,
  serverProps,
}) => {
  if (Array.isArray(Component)) {
    return Component.map((c, index) =>
      renderComponentWithServerProps({
        clientProps,
        Component: c,
        importMap,
        key: String(index),
        serverProps,
      }),
    )
  }

  if (typeof Component === 'function') {
    const isRSC = isReactServerComponentOrFunction(Component)
    const sanitizedProps = removeUndefined({
      ...clientProps,
      ...(isRSC ? serverProps : {}),
    })
    return <Component key={key} {...sanitizedProps} />
  }

  if (typeof Component === 'string' || isPlainObject(Component)) {
    const ResolvedComponent = getFromImportMap<React.ComponentType>({
      importMap,
      PayloadComponent: Component as PayloadComponent,
      schemaPath: '',
    })

    if (ResolvedComponent) {
      const isRSC = isReactServerComponentOrFunction(ResolvedComponent)
      const sanitizedProps = removeUndefined({
        ...clientProps,
        ...(isRSC ? serverProps : {}),
        ...(isRSC && typeof Component === 'object' && Component?.serverProps
          ? Component.serverProps
          : {}),
        ...(typeof Component === 'object' && Component?.clientProps ? Component.clientProps : {}),
      })
      return <ResolvedComponent key={key} {...sanitizedProps} />
    }
  }

  return Fallback
    ? renderComponentWithServerProps({
        clientProps,
        Component: Fallback,
        importMap,
        key,
        serverProps,
      })
    : null
}

export type AdminViewProps = {
  adminProviders?: unknown[]
  createFirstUserData?: SerializableCreateFirstUserData
  customViewRendered?: React.ReactNode
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
  versionViewData?: SerializableVersionViewData
  viewProps: AdminViewClientProps
  visibleEntities: VisibleEntities
}

export function AdminView({
  adminProviders,
  createFirstUserData,
  customViewRendered,
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
  versionViewData,
  viewProps,
  visibleEntities,
}: AdminViewProps) {
  const { templateClassName, templateType } = routeData

  const Actions = useMemo(() => {
    const result: Record<string, React.ReactNode> = {}
    for (const action of routeData.viewActions ?? []) {
      if (!action) {
        continue
      }
      const key = typeof action === 'object' ? action.path : action
      result[key] = RenderClientComponent({
        Component: action,
        importMap: importMap as any,
      })
    }
    return Object.keys(result).length > 0 ? result : undefined
  }, [routeData.viewActions, importMap])

  const resolvedProviders = useMemo(() => {
    if (!adminProviders?.length) {
      return []
    }
    const result: React.ComponentType<{ children?: React.ReactNode }>[] = []
    for (const provider of adminProviders) {
      const Resolved = getFromImportMap<React.ComponentType<{ children?: React.ReactNode }>>({
        importMap: importMap as ImportMap,
        PayloadComponent: provider as any,
        schemaPath: '',
        silent: true,
      })
      if (Resolved) {
        result.push(Resolved)
      }
    }
    return result
  }, [adminProviders, importMap])

  const innerContent = viewProps.clientConfig ? (
    <PageConfigProvider config={viewProps.clientConfig}>
      <ViewRenderer
        createFirstUserData={createFirstUserData}
        customViewRendered={customViewRendered}
        dashboardData={dashboardData}
        documentData={documentData}
        importMap={importMap}
        listData={listData}
        loginData={loginData}
        permissions={permissions}
        routeData={routeData}
        versionsData={versionsData}
        versionViewData={versionViewData}
        viewProps={viewProps}
      />
    </PageConfigProvider>
  ) : null

  const wrappedContent = resolvedProviders.reduceRight<React.ReactNode>(
    (children, Provider) => <Provider>{children}</Provider>,
    innerContent,
  )

  const ViewContent = (
    <React.Fragment>
      <HydrateAuthProvider permissions={permissions} />
      <ImportMapProvider value={importMap as any}>{wrappedContent}</ImportMapProvider>
    </React.Fragment>
  )

  if (templateType === 'default') {
    return (
      <DefaultTemplate
        Actions={Actions}
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
  customViewRendered,
  dashboardData,
  documentData,
  importMap,
  listData,
  loginData,
  permissions,
  routeData,
  versionsData,
  versionViewData,
  viewProps,
}: {
  createFirstUserData?: SerializableCreateFirstUserData
  customViewRendered?: React.ReactNode
  dashboardData?: SerializableDashboardData
  documentData?: SerializableDocumentViewData
  importMap: Record<string, unknown>
  listData?: SerializableListViewData
  loginData?: SerializableLoginData
  permissions: SanitizedPermissions
  routeData: SerializableRouteData
  versionsData?: SerializableVersionsData
  versionViewData?: SerializableVersionViewData
  viewProps: AdminViewClientProps
}) {
  const { viewType } = viewProps

  if (routeData.templateClassName === 'login') {
    return <LoginViewContent importMap={importMap} loginData={loginData} />
  }

  switch (viewType) {
    case 'account':
      return (
        <React.Fragment>
          <DocumentViewContent
            AfterFields={<AccountSettings />}
            documentData={documentData}
            hideTabs
            importMap={importMap}
            permissions={permissions}
            routeData={routeData}
            versionsData={versionsData}
          />
          <AccountClient />
        </React.Fragment>
      )
    case 'createFirstUser':
      return (
        <CreateFirstUserViewContent
          customViewComponent={routeData.customViewComponent}
          data={createFirstUserData}
          importMap={importMap}
        />
      )
    case 'custom':
      if (customViewRendered) {
        return <>{customViewRendered}</>
      }
      return (
        <CustomViewContent
          customViewComponent={routeData.customViewComponent}
          importMap={importMap}
        />
      )
    case 'dashboard':
      return (
        <DashboardViewContent
          dashboardData={dashboardData}
          importMap={importMap}
          permissions={permissions}
        />
      )
    case 'document':
    case 'version':
      return (
        <DocumentViewContent
          documentData={documentData}
          importMap={importMap}
          permissions={permissions}
          routeData={routeData}
          versionsData={versionsData}
          versionViewData={versionViewData}
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
  importMap,
  permissions,
}: {
  dashboardData?: SerializableDashboardData
  importMap: Record<string, unknown>
  permissions: SanitizedPermissions
}) {
  const beforeDashboard = useMemo(() => {
    const components = dashboardData?.beforeDashboard
    if (!components || !Array.isArray(components)) {
      return undefined
    }
    return (
      <>
        {components.map((Component, index) =>
          RenderClientComponent({
            Component,
            importMap: importMap as ImportMap,
            key: String(index),
          }),
        )}
      </>
    )
  }, [dashboardData?.beforeDashboard, importMap])

  const afterDashboard = useMemo(() => {
    const components = dashboardData?.afterDashboard
    if (!components || !Array.isArray(components)) {
      return undefined
    }
    return (
      <>
        {components.map((Component, index) =>
          RenderClientComponent({
            Component,
            importMap: importMap as ImportMap,
            key: String(index),
          }),
        )}
      </>
    )
  }, [dashboardData?.afterDashboard, importMap])

  if (!dashboardData) {
    return null
  }

  if (dashboardData.userId == null) {
    return null
  }

  return (
    <DashboardView permissions={permissions}>
      <DefaultDashboard afterDashboard={afterDashboard} beforeDashboard={beforeDashboard}>
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
    renderComponent: renderComponentWithServerProps,
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
  AfterFields,
  documentData,
  hideTabs,
  importMap,
  permissions,
  routeData,
  versionsData,
  versionViewData,
}: {
  AfterFields?: React.ReactNode
  documentData?: SerializableDocumentViewData
  hideTabs?: boolean
  importMap: Record<string, unknown>
  permissions: SanitizedPermissions
  routeData: SerializableRouteData
  versionsData?: SerializableVersionsData
  versionViewData?: SerializableVersionViewData
}) {
  if (!documentData) {
    return null
  }

  const clientProps = buildDocumentViewClientProps(documentData)

  const CustomLivePreviewComponent = documentData.livePreviewComponent
    ? getFromImportMap<React.ComponentType>({
        importMap: importMap as any,
        PayloadComponent: documentData.livePreviewComponent,
        silent: true,
      })
    : undefined

  const livePreviewSlot = CustomLivePreviewComponent ? <CustomLivePreviewComponent /> : undefined

  const renderSubView = () => {
    switch (routeData.documentSubViewType) {
      case 'api':
        return <APIViewClient />
      case 'version':
        return (
          <VersionDiffViewContent
            collectionSlug={routeData.collectionSlug}
            globalSlug={routeData.globalSlug}
            importMap={importMap}
            versionViewData={versionViewData}
          />
        )
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
      AfterFields={AfterFields}
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
            hideTabs={hideTabs}
            importMap={importMap as any}
          />
        )}
        <HydrateAuthProvider permissions={permissions} />
        <EditDepthProvider>{renderSubView()}</EditDepthProvider>
      </LivePreviewProvider>
    </DocumentInfoProvider>
  )
}

function CustomViewContent({
  customViewComponent,
  importMap,
}: {
  customViewComponent?: SerializableRouteData['customViewComponent']
  importMap: Record<string, unknown>
}) {
  if (!customViewComponent) {
    return null
  }

  const CustomComponent = getFromImportMap<React.ComponentType>({
    importMap: importMap as ImportMap,
    PayloadComponent: customViewComponent,
    schemaPath: '',
    silent: true,
  })

  if (!CustomComponent) {
    return null
  }

  return <CustomComponent />
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

function LoginViewContent({
  importMap,
  loginData,
}: {
  importMap: Record<string, unknown>
  loginData?: SerializableLoginData
}) {
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
      {loginData.beforeLogin?.map((Component, index) =>
        RenderClientComponent({
          Component,
          importMap: importMap as ImportMap,
          key: String(index),
        }),
      )}
      {!loginData.isLocalStrategyDisabled && (
        <LoginForm
          prefillEmail={loginData.prefillEmail}
          prefillPassword={loginData.prefillPassword}
          prefillUsername={loginData.prefillUsername}
          searchParams={searchParams}
        />
      )}
      {loginData.afterLogin?.map((Component, index) =>
        RenderClientComponent({
          Component,
          importMap: importMap as ImportMap,
          key: String(index),
        }),
      )}
    </React.Fragment>
  )
}

function VersionDiffViewContent({
  collectionSlug,
  globalSlug,
  importMap,
  versionViewData,
}: {
  collectionSlug?: string
  globalSlug?: string
  importMap: Record<string, unknown>
  versionViewData?: SerializableVersionViewData
}) {
  const { config } = useConfig()
  const { i18n, t } = useTranslation()

  const clientSchemaMap = useMemo<ClientFieldSchemaMap>(() => {
    const raw = versionViewData?.clientSchemaMap
    if (raw instanceof Map) {
      return raw as ClientFieldSchemaMap
    }
    return new Map(Object.entries(raw ?? {})) as ClientFieldSchemaMap
  }, [versionViewData?.clientSchemaMap])

  const versionData = versionViewData
  if (!versionData) {
    return null
  }

  const {
    canUpdate,
    currentlyPublishedVersion,
    latestDraftVersion,
    modifiedOnly,
    previousPublishedVersion,
    previousVersion,
    selectedLocales,
    versionFrom,
    versionTo,
  } = versionData

  const entitySlug = collectionSlug || globalSlug

  const collectionsMap: Record<string, { config: any }> = {}
  if (config.collections) {
    for (const col of config.collections) {
      collectionsMap[col.slug] = { config: col }
    }
  }

  const mockReq = {
    payload: {
      blocks: (versionData.blocks ?? {}) as Record<string, FlattenedBlock>,
      collections: collectionsMap,
      config,
      importMap: importMap as ImportMap,
      logger: {
        error: (...args: unknown[]) => console.error(...args),
      },
    },
  } as any

  const { versionFields } = buildVersionFields({
    clientSchemaMap,
    customDiffComponents: {},
    entitySlug: entitySlug!,
    fields: versionData.fields as any,
    fieldsPermissions: versionData.fieldsPermissions as any,
    i18n: i18n as any,
    modifiedOnly,
    parentIndexPath: '',
    parentIsLocalized: false,
    parentPath: '',
    parentSchemaPath: '',
    req: mockReq,
    selectedLocales,
    versionFromSiblingData: {
      ...versionFrom?.version,
      updatedAt: versionFrom?.updatedAt,
    },
    versionToSiblingData: {
      ...versionTo.version,
      updatedAt: versionTo.updatedAt,
    },
  })

  const RenderedDiff = <RenderVersionFieldsToDiff parent={true} versionFields={versionFields} />

  const userLocale = config.localization ? config.localization.defaultLocale : undefined

  const versionToCreatedAtFormatted = versionTo.updatedAt
    ? formatDate({
        date:
          typeof versionTo.updatedAt === 'string'
            ? new Date(versionTo.updatedAt)
            : (versionTo.updatedAt as Date),
        i18n,
        pattern: config.admin.dateFormat,
      })
    : ''

  const formatPill = ({
    doc,
    labelOverride,
    labelStyle,
    labelSuffix,
  }: {
    doc: TypeWithVersion<any>
    labelOverride?: string
    labelStyle?: 'pill' | 'text'
    labelSuffix?: React.ReactNode
  }): React.ReactNode => {
    return (
      <VersionPillLabel
        currentlyPublishedVersion={(currentlyPublishedVersion ?? undefined) as any}
        doc={doc as any}
        key={doc.id}
        labelFirst={true}
        labelOverride={labelOverride}
        labelStyle={labelStyle ?? 'text'}
        labelSuffix={labelSuffix}
        latestDraftVersion={(latestDraftVersion ?? undefined) as any}
      />
    )
  }

  let versionFromOptions: {
    doc: TypeWithVersion<any>
    labelOverride?: string
    updatedAt: Date
    value: string
  }[] = []

  if (previousVersion?.id) {
    versionFromOptions.push({
      doc: previousVersion,
      labelOverride: t('version:previousVersion'),
      updatedAt: new Date(previousVersion.updatedAt),
      value: String(previousVersion.id),
    })
  }

  const publishedNewerThanDraft = Boolean(
    currentlyPublishedVersion?.updatedAt &&
      latestDraftVersion?.updatedAt &&
      currentlyPublishedVersion.updatedAt > latestDraftVersion.updatedAt,
  )

  if (latestDraftVersion && !publishedNewerThanDraft) {
    versionFromOptions.push({
      doc: latestDraftVersion,
      updatedAt: new Date(latestDraftVersion.updatedAt),
      value: String(latestDraftVersion.id),
    })
  }

  if (currentlyPublishedVersion) {
    versionFromOptions.push({
      doc: currentlyPublishedVersion,
      updatedAt: new Date(currentlyPublishedVersion.updatedAt),
      value: String(currentlyPublishedVersion.id),
    })
  }

  if (previousPublishedVersion && currentlyPublishedVersion?.id !== previousPublishedVersion.id) {
    versionFromOptions.push({
      doc: previousPublishedVersion,
      labelOverride: t('version:previouslyPublished'),
      updatedAt: new Date(previousPublishedVersion.updatedAt),
      value: String(previousPublishedVersion.id),
    })
  }

  if (
    versionFrom?.id &&
    !versionFromOptions.some((option) => option.value === String(versionFrom.id))
  ) {
    versionFromOptions.push({
      doc: versionFrom,
      labelOverride: t('version:specificVersion'),
      updatedAt: new Date(versionFrom.updatedAt),
      value: String(versionFrom.id),
    })
  }

  versionFromOptions = versionFromOptions.sort((a, b) => {
    if (a && b) {
      return b.updatedAt.getTime() - a.updatedAt.getTime()
    }
    return 0
  })

  const versionToIsVersionFrom = versionFrom?.id === versionTo.id

  const versionFromComparisonOptions: Array<{ label: React.ReactNode | string; value: string }> = []

  for (const option of versionFromOptions) {
    const isVersionTo = option.value === String(versionTo.id)

    if (isVersionTo && !versionToIsVersionFrom) {
      continue
    }

    const alreadyAdded = versionFromComparisonOptions.some(
      (existingOption) => existingOption.value === option.value,
    )

    if (alreadyAdded) {
      continue
    }

    const otherOptionsWithSameID = versionFromOptions.filter(
      (existingOption) => existingOption.value === option.value && existingOption !== option,
    )

    const labelSuffix = otherOptionsWithSameID?.length ? (
      <span key={`${option.value}-suffix`}>
        {' ('}
        {otherOptionsWithSameID.map((optionWithSameID, index) => {
          const label =
            optionWithSameID.labelOverride ||
            getVersionLabel({
              currentLocale: userLocale,
              currentlyPublishedVersion: (currentlyPublishedVersion ?? undefined) as any,
              latestDraftVersion: (latestDraftVersion ?? undefined) as any,
              t: t as any,
              version: optionWithSameID.doc,
            }).label

          return (
            <React.Fragment key={`${optionWithSameID.value}-${index}`}>
              {index > 0 ? ', ' : ''}
              {label}
            </React.Fragment>
          )
        })}
        {')'}
      </span>
    ) : undefined

    versionFromComparisonOptions.push({
      label: formatPill({
        doc: option.doc,
        labelOverride: option.labelOverride,
        labelSuffix,
      }),
      value: option.value,
    })
  }

  return (
    <DefaultVersionView
      canUpdate={canUpdate}
      modifiedOnly={modifiedOnly}
      RenderedDiff={RenderedDiff}
      selectedLocales={selectedLocales}
      versionFromCreatedAt={versionFrom?.createdAt}
      versionFromID={versionFrom ? String(versionFrom.id) : undefined}
      versionFromOptions={versionFromComparisonOptions}
      versionToCreatedAt={versionTo.createdAt}
      versionToCreatedAtFormatted={versionToCreatedAtFormatted}
      VersionToCreatedAtLabel={formatPill({ doc: versionTo, labelStyle: 'pill' })}
      versionToID={String(versionTo.id)}
      versionToStatus={versionTo.version?._status}
    />
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
