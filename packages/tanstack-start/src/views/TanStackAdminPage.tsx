'use client'

import { AdminNavLinks, PageConfigProvider, useTranslation } from '@payloadcms/ui'
import { EntityType, groupNavItems } from '@payloadcms/ui/shared'
import { DefaultTemplateShell } from '@payloadcms/ui/templates/Default'
import { MinimalTemplate } from '@payloadcms/ui/templates/Minimal'
import React from 'react'

import type { SerializablePageState } from './Root/types.js'

import { getAuthViewByType } from './getAuthViewByType.js'
import { getDashboardViewByType } from './getDashboardViewByType.js'
import { getViewByType } from './getViewByType.js'
import { UnsupportedView } from './shared.js'

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

  const View = getViewByType(pageState.viewType)

  if (View) {
    return <View pageState={pageState} />
  }

  return (
    <UnsupportedView
      description="This admin route has not been migrated to the TanStack client-rendered path yet."
      title="Unsupported View"
    />
  )
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
