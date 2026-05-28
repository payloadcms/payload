import type {
  AdminViewClientProps,
  AdminViewServerProps,
  ClientConfig,
  ImportMap,
  InitPageResult,
  ListQuery,
  ViewTypes,
} from 'payload'

import React from 'react'

import type { GetRouteDataResult } from './getRouteData.js'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { AccountViewRSC } from '../Account/AccountViewRSC.js'
import { CreateFirstUserViewRSC } from '../CreateFirstUser/CreateFirstUserViewRSC.js'
import { DashboardViewRSC } from '../Dashboard/DashboardViewRSC.js'
import { DocumentViewRSC } from '../Document/DocumentViewRSC.js'
import { ForgotPasswordView } from '../ForgotPassword/index.js'
import { ListViewRSC } from '../List/ListViewRSC.js'
import { LoginViewRSC } from '../Login/LoginViewRSC.js'
import { LogoutInactivity, LogoutView } from '../Logout/index.js'
import { ResetPassword } from '../ResetPassword/index.js'
import { UnauthorizedView } from '../Unauthorized/index.js'
import { VerifyViewRSC } from '../Verify/VerifyViewRSC.js'
import { VersionsViewRSC } from '../Versions/VersionsViewRSC.js'

export type RenderAdminViewArgs = {
  clientConfig: ClientConfig
  importMap: ImportMap
  initPageResult: InitPageResult
  /**
   * Optional list-view tuning passed through to the shared `ListViewRSC`.
   * The next adapter pre-builds these from `searchParams`; tanstack-start
   * does the same at the route layer.
   */
  listView?: {
    customCellProps?: Record<string, any>
    disableBulkDelete?: boolean
    disableBulkEdit?: boolean
    disableQueryPresets?: boolean
    enableRowSelections?: boolean
    overrideEntityVisibility?: boolean
    query?: ListQuery
    redirectAfterDelete?: boolean
    redirectAfterDuplicate?: boolean
    redirectAfterRestore?: boolean
  }
  params: { segments: string[] }
  routeData: GetRouteDataResult
  searchParams: { [key: string]: string | string[] }
}

/**
 * Framework-agnostic admin view dispatcher.
 *
 * Given resolved `routeData` (from `getRouteData`) plus standard server props,
 * picks the right shared RSC (`*ViewRSC`) and returns its rendered React node.
 *
 * Does NOT wrap in template chrome — the caller (RootPage / AdminPage) is
 * responsible for that, since templates live at the framework boundary.
 *
 * Throws:
 *  - `Error('not-found')`        → adapter translates to native 404
 *  - `Error('redirect:<url>')`   → adapter translates to native redirect
 *
 * Both errors are re-thrown by the underlying view RSCs (see ListViewRSC,
 * DocumentViewRSC, LoginViewRSC) — this dispatcher just propagates them.
 */
export const renderAdminView = async ({
  clientConfig,
  importMap,
  initPageResult,
  listView,
  params,
  routeData,
  searchParams,
}: RenderAdminViewArgs): Promise<React.ReactNode> => {
  const {
    collectionConfig,
    customViewComponent,
    documentSubViewType,
    globalConfig,
    routeParams,
    viewActions,
    viewType,
  } = routeData

  const {
    locale,
    permissions,
    req,
    req: { payload },
    visibleEntities,
  } = initPageResult

  const serverProps: AdminViewServerProps = {
    clientConfig,
    collectionConfig,
    collectionSlug: collectionConfig?.slug,
    docID: routeParams.id,
    documentSubViewType,
    globalConfig,
    globalSlug: globalConfig?.slug,
    i18n: req.i18n,
    importMap,
    initPageResult,
    locale,
    params,
    payload,
    renderComponent: RenderServerComponent,
    searchParams,
    viewActions,
    viewType,
    visibleEntities,
  }

  // If config provides a custom component for this route, prefer it.
  if (customViewComponent) {
    return RenderServerComponent({
      clientProps: {
        clientConfig,
        collectionSlug: collectionConfig?.slug,
        docID: routeParams.id,
        documentSubViewType,
        globalSlug: globalConfig?.slug,
        viewType,
      } satisfies AdminViewClientProps,
      Component: customViewComponent,
      importMap,
      serverProps,
    })
  }

  switch (viewType) {
    case 'account':
      return AccountViewRSC(serverProps)

    case 'api':
    case 'default':
    case 'document':
    case 'livePreview':
    case 'preview':
    case 'version':
      return DocumentViewRSC(serverProps)

    case 'createFirstUser':
      return CreateFirstUserViewRSC(serverProps)

    case 'dashboard':
      return DashboardViewRSC(serverProps)

    case 'forgot':
      return <ForgotPasswordView {...serverProps} />

    case 'hierarchy':
    case 'list':
    case 'trash':
      return ListViewRSC({
        ...listView,
        clientConfig,
        collectionConfig,
        enableRowSelections: listView?.enableRowSelections ?? true,
        locale,
        params,
        permissions,
        req,
        searchParams,
        trash: viewType === 'trash',
        viewType,
        visibleEntities,
      } as never)

    case 'inactivity':
      return <LogoutInactivity {...serverProps} />

    case 'login':
      return LoginViewRSC(serverProps)

    case 'logout':
      return <LogoutView {...serverProps} />

    case 'reset':
      return <ResetPassword {...serverProps} />

    case 'unauthorized':
      return <UnauthorizedView {...serverProps} />

    case 'verify':
      return VerifyViewRSC(serverProps)

    case 'versions':
      return VersionsViewRSC({
        ...serverProps,
        hasPublishedDoc: false,
        routeSegments: params.segments,
      } as never)

    default:
      throw new Error('not-found')
  }
}
