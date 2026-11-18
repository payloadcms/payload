import {
  payloadAdminIndexRoute,
  payloadAdminSplatRoute,
  payloadLayoutRoute,
} from '../dist/exports/client.js'
import { loadLayoutData } from '../dist/exports/layouts.js'
import { loadAdminPage } from '../dist/exports/server.js'
import type { NotFoundRouteProps } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

declare const adminPageArgs: Parameters<typeof loadAdminPage>[0]
declare const layoutDataArgs: Parameters<typeof loadLayoutData>[0]
declare const adminRouteArgs: Parameters<typeof payloadAdminIndexRoute>[0]
declare const layoutRouteArgs: Parameters<typeof payloadLayoutRoute>[0]

type CompatibleRouteOptions = {
  loader: {
    staleReloadMode?: 'background' | 'blocking'
  }
  notFoundComponent?: (props: NotFoundRouteProps) => unknown
}

declare function acceptRouteOptions(options: CompatibleRouteOptions): void

const loadAdminPageFn = createServerFn({ method: 'GET' }).handler(() =>
  loadAdminPage(adminPageArgs),
)
const loadLayoutDataFn = createServerFn({ method: 'GET' }).handler(() =>
  loadLayoutData(layoutDataArgs),
)

acceptRouteOptions(payloadLayoutRoute(layoutRouteArgs))
acceptRouteOptions(payloadAdminIndexRoute(adminRouteArgs))
acceptRouteOptions(payloadAdminSplatRoute(adminRouteArgs))
