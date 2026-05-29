import type {
  AdminViewServerProps,
  Data,
  DocumentViewServerProps,
  ListQuery,
  ListViewClientProps,
  ListViewServerPropsOnly,
  PayloadComponent,
  RenderDocumentVersionsProperties,
  ServerProps,
  WidgetServerProps,
} from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { AccountViewRSC } from '@payloadcms/ui/views/Account/AccountViewRSC'
import { CreateFirstUserViewRSC } from '@payloadcms/ui/views/CreateFirstUser/CreateFirstUserViewRSC'
import { DashboardViewRSC } from '@payloadcms/ui/views/Dashboard/DashboardViewRSC'
import { DefaultDashboard as DefaultDashboardUI } from '@payloadcms/ui/views/Dashboard/Default'
import { ModularDashboard as ModularDashboardUI } from '@payloadcms/ui/views/Dashboard/Default/ModularDashboard'
import { getModularDashboardData } from '@payloadcms/ui/views/Dashboard/Default/ModularDashboard/getModularDashboardData'
import {
  type RenderDocumentArgs,
  renderDocument as renderDocumentRSC,
} from '@payloadcms/ui/views/Document/DocumentViewRSC'
import { ListViewRSC } from '@payloadcms/ui/views/List/ListViewRSC'
import { LoginViewRSC } from '@payloadcms/ui/views/Login/LoginViewRSC'
import { notFound, redirect } from 'next/navigation.js'
import { logError } from 'payload'
import React from 'react'

/**
 * Translates the shared "throw `Error('not-found')` / `Error('redirect:<url>')`"
 * contract into Next.js's `notFound()` / `redirect()`.
 *
 * All Next view wrappers below funnel through this helper so the translation
 * logic lives in exactly one place.
 */
async function withNextErrorTranslation<T>(work: () => Promise<T> | T): Promise<T | undefined> {
  try {
    return await work()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message === 'NEXT_REDIRECT' || message === 'NEXT_NOT_FOUND') {
      throw err
    }
    if (message === 'not-found') {
      return notFound()
    }
    if (message.startsWith('redirect:')) {
      redirect(message.slice('redirect:'.length))
    }
    throw err
  }
}

// -----------------------------------------------------------------------------
// Re-exported view types & DefaultDashboard helpers used by custom Next routes
// -----------------------------------------------------------------------------

export type {
  DashboardViewClientProps,
  DashboardViewServerProps,
  DashboardViewServerPropsOnly,
  DefaultDashboardProps,
} from '@payloadcms/ui/views/Dashboard/Default'

import type {
  DashboardViewServerProps,
  DashboardViewServerPropsOnly,
} from '@payloadcms/ui/views/Dashboard/Default'

/**
 * Renders the modular widget grid + per-config `before`/`afterDashboard` slots.
 * Exposed so custom dashboards composed in `app/` can drop it in directly.
 */
export const DefaultDashboard = async (
  props: DashboardViewServerProps,
): Promise<React.ReactNode> => {
  const { i18n, locale, params, payload, permissions, searchParams, user } = props
  const { afterDashboard, beforeDashboard } = payload.config.admin.components
  const { cookies, permissions: initPermissions, req } = props.initPageResult

  const serverProps: ServerProps = {
    i18n,
    locale,
    params,
    payload,
    permissions,
    renderComponent: RenderServerComponent,
    searchParams,
    user,
  }

  const { clientWidgets, layoutItems } = await getModularDashboardData({ req, user })

  const clientLayout = layoutItems.map((item) => ({
    component: RenderServerComponent({
      Component: item.widgetComponent,
      importMap: payload.importMap,
      serverProps: {
        cookies,
        locale,
        permissions: initPermissions,
        renderComponent: RenderServerComponent,
        req,
        widgetData: item.widgetData,
        widgetSlug: item.widgetSlug,
      } satisfies WidgetServerProps,
    }),
    item: {
      id: item.id,
      data: item.data,
      maxWidth: item.maxWidth,
      minWidth: item.minWidth,
      width: item.width,
    },
  }))

  return (
    <DefaultDashboardUI
      afterDashboard={
        afterDashboard
          ? RenderServerComponent({
              Component: afterDashboard,
              importMap: payload.importMap,
              serverProps,
            })
          : undefined
      }
      beforeDashboard={
        beforeDashboard
          ? RenderServerComponent({
              Component: beforeDashboard,
              importMap: payload.importMap,
              serverProps,
            })
          : undefined
      }
    >
      <ModularDashboardUI clientLayout={clientLayout} clientWidgets={clientWidgets} />
    </DefaultDashboardUI>
  )
}

// -----------------------------------------------------------------------------
// Per-view thin wrappers used by Next adapter consumers
// -----------------------------------------------------------------------------

export const AccountView: React.FC<AdminViewServerProps> = (args) =>
  withNextErrorTranslation(() => AccountViewRSC(args))

export const CreateFirstUserView: React.FC<AdminViewServerProps> = (args) =>
  withNextErrorTranslation(() => CreateFirstUserViewRSC(args))

export const DashboardView: React.FC<AdminViewServerProps> = (args) =>
  withNextErrorTranslation(() => DashboardViewRSC(args))

export const LoginView: React.FC<AdminViewServerProps> = (args) =>
  withNextErrorTranslation(() => LoginViewRSC(args))

// -----------------------------------------------------------------------------
// List view: thin wrapper + the public `renderListView` used by drawers
// -----------------------------------------------------------------------------

/**
 * @internal
 */
export type RenderListViewArgs = {
  ComponentOverride?:
    | PayloadComponent
    | React.ComponentType<ListViewClientProps | (ListViewClientProps & ListViewServerPropsOnly)>
  customCellProps?: Record<string, any>
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  disableQueryPresets?: boolean
  drawerSlug?: string
  enableRowSelections: boolean
  overrideEntityVisibility?: boolean
  /**
   * If no ListQuery is provided, `req.query` will be used.
   */
  query?: ListQuery
  redirectAfterDelete?: boolean
  redirectAfterDuplicate?: boolean
  /**
   * @experimental This prop is subject to change in future releases.
   */
  trash?: boolean
} & AdminViewServerProps

/**
 * Renders the list view on the server for both the default list view and the
 * list view inside drawers. Delegates to the framework-agnostic `ListViewRSC`.
 *
 * @internal
 */
export const renderListView = async (
  args: RenderListViewArgs,
): Promise<{
  List: React.ReactNode
}> => {
  const {
    clientConfig,
    ComponentOverride,
    customCellProps,
    disableBulkDelete,
    disableBulkEdit,
    disableQueryPresets,
    drawerSlug,
    enableRowSelections,
    initPageResult: { collectionConfig, locale, permissions, req, visibleEntities },
    overrideEntityVisibility,
    params,
    query,
    searchParams,
    trash,
    viewType,
  } = args

  const List = await ListViewRSC({
    clientConfig,
    collectionConfig,
    ComponentOverride: ComponentOverride as PayloadComponent | undefined,
    customCellProps,
    disableBulkDelete,
    disableBulkEdit,
    disableQueryPresets,
    drawerSlug,
    enableRowSelections,
    locale,
    overrideEntityVisibility,
    params,
    permissions,
    query,
    req,
    searchParams,
    trash,
    viewType,
    visibleEntities,
  })

  return { List }
}

export const ListView: React.FC<RenderListViewArgs> = (args) =>
  withNextErrorTranslation(async () => {
    const { List: RenderedList } = await renderListView({ ...args, enableRowSelections: true })
    return RenderedList
  })

// -----------------------------------------------------------------------------
// Document view: thin wrapper + the public `renderDocument` used by drawers
// -----------------------------------------------------------------------------

/**
 * Public document-render helper consumed by drawer/on-demand flows. Mirrors
 * the prior next-side `renderDocument`, but delegates to the shared
 * `renderDocument` RSC in `ui`.
 *
 * Translates `'redirect:<url>'` into Next's `redirect()`. `'not-found'`
 * is intentionally rethrown so the calling drawer can choose its own
 * not-found handling.
 */
export const renderDocument = async (
  args: {
    drawerSlug?: string
    overrideEntityVisibility?: boolean
    readonly redirectAfterCreate?: boolean
    readonly redirectAfterDelete?: boolean
    readonly redirectAfterDuplicate?: boolean
    readonly redirectAfterRestore?: boolean
    versions?: RenderDocumentVersionsProperties
  } & AdminViewServerProps,
): Promise<{
  data: Data
  Document: React.ReactNode
}> => {
  try {
    return await renderDocumentRSC(args as RenderDocumentArgs)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.startsWith('redirect:')) {
      redirect(message.slice('redirect:'.length))
    }
    throw err
  }
}

export const DocumentView: React.FC<AdminViewServerProps & DocumentViewServerProps> = async (
  props,
) => {
  try {
    const { Document: RenderedDocument } = await renderDocument(props)
    return RenderedDocument
  } catch (error) {
    if (error?.message === 'NEXT_REDIRECT' || error?.message === 'NEXT_NOT_FOUND') {
      throw error
    }
    logError({ err: error, payload: props.initPageResult.req.payload })
    if (error.message === 'not-found') {
      notFound()
    }
  }
}
