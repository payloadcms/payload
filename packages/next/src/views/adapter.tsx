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

export function AccountView(props: AdminViewServerProps) {
  return (
    <AccountViewBase {...props} onNotFound={notFound} renderComponent={RenderServerComponent} />
  )
}

export function CreateFirstUserView(props: AdminViewServerProps) {
  return <CreateFirstUserViewBase {...props} renderComponent={RenderServerComponent} />
}

export function DashboardView(props: AdminViewServerProps) {
  return (
    <DashboardViewBase
      {...props}
      DefaultDashboard={DefaultDashboard}
      renderComponent={RenderServerComponent}
    />
  )
}

export function Verify(props: AdminViewServerProps) {
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
}

export function VersionsView(props: DocumentViewServerProps) {
  return <VersionsViewBase {...props} onNotFound={notFound} />
}

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

export const HierarchyView: React.FC<Omit<RenderListWrapperArgs, 'enableRowSelections'>> = async (
  args,
) => {
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
}

export const TrashView: React.FC<Omit<RenderListWrapperArgs, 'enableRowSelections'>> = async (
  args,
) => {
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
}
