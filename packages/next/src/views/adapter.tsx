import type { AdminViewServerProps, DocumentViewServerProps, ListQuery } from 'payload'

import { AccountView as AccountViewBase } from '@payloadcms/ui/views/Account'
import { CreateFirstUserView as CreateFirstUserViewBase } from '@payloadcms/ui/views/CreateFirstUser'
import { DashboardView as DashboardViewBase } from '@payloadcms/ui/views/Dashboard'
import { VerifyView as VerifyViewBase } from '@payloadcms/ui/views/Verify'
import { VersionsView as VersionsViewBase } from '@payloadcms/ui/views/Versions'
import { notFound } from 'next/navigation.js'
import React from 'react'

import { Logo } from '../elements/Logo/index.js'
import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'
import { DefaultDashboard } from './Dashboard/Default/index.js'
import { renderListView } from './List/index.js'

export { verifyBaseClass } from '@payloadcms/ui/views/Verify'

type RenderListWrapperArgs = {
  customCellProps?: Record<string, any>
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  disableQueryPresets?: boolean
  drawerSlug?: string
  enableRowSelections: boolean
  overrideEntityVisibility?: boolean
  query: ListQuery
  redirectAfterDelete?: boolean
  redirectAfterDuplicate?: boolean
  redirectAfterRestore?: boolean
} & AdminViewServerProps

/**
 * Keyed map of admin views adapted for Next.js.
 * Each entry wraps a framework-agnostic ui view with Next-specific bits
 * (RenderServerComponent, notFound, Logo, DefaultDashboard).
 * Other framework adapters (e.g. Tanstack) export the same shape with
 * their own framework wiring.
 */
export const adminViews = {
  account: (props: AdminViewServerProps) => (
    <AccountViewBase {...props} onNotFound={notFound} renderComponent={RenderServerComponent} />
  ),
  createFirstUser: (props: AdminViewServerProps) => (
    <CreateFirstUserViewBase {...props} renderComponent={RenderServerComponent} />
  ),
  dashboard: (props: AdminViewServerProps) => (
    <DashboardViewBase
      {...props}
      DefaultDashboard={DefaultDashboard}
      renderComponent={RenderServerComponent}
    />
  ),
  hierarchy: (async (args) => {
    try {
      const { List } = await renderListView({
        ...args,
        enableRowSelections: true,
        viewType: 'hierarchy',
      })
      return List
    } catch (error) {
      if (error.message === 'not-found') {
        notFound()
      }
      console.error(error) // eslint-disable-line no-console
    }
  }) satisfies React.FC<Omit<RenderListWrapperArgs, 'enableRowSelections'>>,
  trash: (async (args) => {
    try {
      const { List } = await renderListView({
        ...args,
        enableRowSelections: true,
        trash: true,
        viewType: 'trash',
      })
      return List
    } catch (error) {
      if (error.message === 'not-found') {
        notFound()
      }
      console.error(error) // eslint-disable-line no-console
    }
  }) satisfies React.FC<Omit<RenderListWrapperArgs, 'enableRowSelections'>>,
  verify: (props: AdminViewServerProps) => {
    const { initPageResult, params, searchParams } = props
    const { locale, permissions, req } = initPageResult
    const { i18n, payload, user } = req

    return (
      <VerifyViewBase
        {...props}
        logo={
          <Logo
            i18n={i18n}
            locale={locale}
            params={params}
            payload={payload}
            permissions={permissions}
            searchParams={searchParams}
            user={user}
          />
        }
      />
    )
  },
  versions: (props: DocumentViewServerProps) => (
    <VersionsViewBase {...props} onNotFound={notFound} />
  ),
} as const
