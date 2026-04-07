'use client'

import type { NavGroupType } from '@payloadcms/ui/shared'
import type {
  AdminViewClientProps,
  Locale,
  NavPreferences,
  SanitizedPermissions,
  VisibleEntities,
} from 'payload'

import {
  HydrateAuthProvider,
  ListQueryProvider,
  PageConfigProvider,
  SetStepNav,
} from '@payloadcms/ui'
import { DefaultNav } from '@payloadcms/ui/elements/Nav'
import { DefaultTemplate } from '@payloadcms/ui/templates/Default'
import { MinimalTemplate } from '@payloadcms/ui/templates/Minimal'
import { LoginForm } from '@payloadcms/ui/views/Login/LoginForm'
import React from 'react'

import type {
  SerializableDashboardData,
  SerializableListData,
  SerializableLoginData,
  SerializableRouteData,
} from './Root/index.js'

export type AdminViewProps = {
  dashboardData?: SerializableDashboardData
  listData?: SerializableListData
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
  dashboardData,
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
      {viewProps.clientConfig && (
        <PageConfigProvider config={viewProps.clientConfig}>
          <ViewRenderer
            dashboardData={dashboardData}
            listData={listData}
            loginData={loginData}
            routeData={routeData}
            viewProps={viewProps}
          />
        </PageConfigProvider>
      )}
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
  dashboardData,
  listData,
  loginData,
  routeData,
  viewProps,
}: {
  dashboardData?: SerializableDashboardData
  listData?: SerializableListData
  loginData?: SerializableLoginData
  routeData: SerializableRouteData
  viewProps: AdminViewClientProps
}) {
  const { viewType } = viewProps

  if (routeData.templateClassName === 'login') {
    return <LoginViewContent loginData={loginData} />
  }

  switch (viewType) {
    case 'dashboard':
      return <DashboardViewContent dashboardData={dashboardData} />
    case 'list':
      return <ListViewContent listData={listData} routeData={routeData} />
    default:
      return null
  }
}

function DashboardViewContent({ dashboardData }: { dashboardData?: SerializableDashboardData }) {
  return (
    <React.Fragment>
      <SetStepNav nav={[]} />
      <div className="dashboard" style={{ padding: 'calc(var(--base) * 2)' }}>
        <div className="gutter--left gutter--right">
          {dashboardData?.navGroups?.map((group) => (
            <div key={group.label} style={{ marginBottom: 'calc(var(--base) * 2)' }}>
              <h3>{group.label}</h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {group.entities.map((entity) => {
                  const label = typeof entity.label === 'string' ? entity.label : entity.slug
                  const href = `/admin/${entity.type}/${entity.slug}`
                  return (
                    <li key={entity.slug} style={{ marginBottom: 'var(--base)' }}>
                      <a href={href}>{label}</a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </React.Fragment>
  )
}

function ListViewContent({
  listData,
  routeData,
}: {
  listData?: SerializableListData
  routeData: SerializableRouteData
}) {
  if (!listData) {
    return null
  }

  const { collectionLabel, collectionSlug, data, hasCreatePermission, newDocumentURL, query } =
    listData

  const docs = data?.docs ?? []
  const fieldKeys = docs.length > 0 ? Object.keys(docs[0]).filter((k) => k !== 'id') : []
  const displayFields = fieldKeys.slice(0, 5)

  return (
    <React.Fragment>
      <SetStepNav
        nav={[
          {
            label: collectionLabel,
            url: `/admin/collections/${collectionSlug}`,
          },
        ]}
      />
      <ListQueryProvider
        collectionSlug={collectionSlug}
        data={data}
        modifySearchParams
        query={query}
      >
        <div className="list-view" style={{ padding: 'calc(var(--base) * 2)' }}>
          <div className="gutter--left gutter--right">
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 'calc(var(--base) * 2)',
              }}
            >
              <h2 style={{ margin: 0 }}>{collectionLabel}</h2>
              {hasCreatePermission && (
                <a className="btn btn--style-primary btn--size-medium" href={newDocumentURL}>
                  Create New
                </a>
              )}
            </div>
            {docs.length === 0 ? (
              <div style={{ padding: 'calc(var(--base) * 3)', textAlign: 'center' }}>
                <p>No results found.</p>
              </div>
            ) : (
              <React.Fragment>
                <div className="table">
                  <table cellPadding="0" cellSpacing="0">
                    <thead>
                      <tr>
                        <th>ID</th>
                        {displayFields.map((field) => (
                          <th key={field}>{field}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map((doc: Record<string, unknown>, rowIndex: number) => (
                        <tr className={`row-${rowIndex + 1}`} key={String(doc.id)}>
                          <td>
                            <a href={`/admin/collections/${collectionSlug}/${String(doc.id)}`}>
                              {String(doc.id).slice(0, 8)}...
                            </a>
                          </td>
                          {displayFields.map((field) => (
                            <td key={field}>{formatCellValue(doc[field])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--base)',
                    justifyContent: 'space-between',
                    marginTop: 'calc(var(--base) * 2)',
                  }}
                >
                  <span>
                    Showing {docs.length} of {data.totalDocs} documents
                  </span>
                  <span>
                    Page {data.page} of {data.totalPages}
                  </span>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      </ListQueryProvider>
    </React.Fragment>
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

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-'
  }
  if (typeof value === 'string') {
    return value.length > 60 ? value.slice(0, 60) + '...' : value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value instanceof Date) {
    return value.toLocaleDateString()
  }
  if (Array.isArray(value)) {
    return `[${value.length} items]`
  }
  if (typeof value === 'object') {
    return '[Object]'
  }
  return String(value)
}
