'use client'
import type { DocumentRootProps } from '@payloadcms/ui/layouts/DocumentRoot'
import type { RootLayoutData } from '@payloadcms/ui/utilities/getRootLayoutData'

import { DocumentRoot } from '@payloadcms/ui/layouts/DocumentRoot'
import { HeadContent, Scripts, useRouterState } from '@tanstack/react-router'
import React from 'react'

export type PayloadAdminShellProps = {
  readonly children: React.ReactNode
}

/**
 * The `<html>` document shell for Payload admin routes — the TanStack Start
 * equivalent of `@payloadcms/next`'s root layout `<html>`. Sets
 * `data-theme`/`lang`/`dir` on `<html>` from the server-computed layout data
 * (`getLayoutData`, exposed on the `/_payload` route loader), so the admin
 * panel shares document rendering and request preferences with Next's `RootLayout`.
 * A blocking script resolves the default theme from the browser preference before first paint.
 */
export function PayloadAdminShell({ children }: PayloadAdminShellProps) {
  const documentProps = useRouterState({
    select: (state): Partial<DocumentRootProps> => {
      for (const match of state.matches) {
        const data = match.loaderData as Partial<RootLayoutData> | undefined

        if (data?.theme && data?.languageCode) {
          return {
            dir: data.dir,
            highContrastMode: data.highContrastMode,
            languageCode: data.languageCode,
            suppressHydrationWarning: data.suppressHydrationWarning,
            theme: data.theme,
            themeSource: data.themeSource ?? 'default',
          }
        }
      }

      // No layout data yet (fresh session before the loader resolves): default
      // to `ltr` so the `[dir='ltr']`-scoped admin layout rules (e.g. the
      // document sidebar divider) still match, matching Next's `ltr` default.
      return { dir: 'ltr', suppressHydrationWarning: true, themeSource: 'default' }
    },
  })

  return (
    <DocumentRoot {...documentProps} head={<HeadContent />}>
      {children}
      <Scripts />
    </DocumentRoot>
  )
}

export type WithPayloadRootOptions = {
  /**
   * Path prefix that mounts the Payload admin panel (`config.routes.admin`).
   * Routes under it render the Payload admin document shell; everything else
   * renders your own shell. Defaults to `'/admin'`.
   */
  adminRoute?: string
}

/**
 * Wraps your application's root document shell so Payload owns its own
 * `<html>` chrome on admin routes while your shell renders everywhere else.
 *
 * Attach the result to the root route's `shellComponent`; it is the single
 * integration touch point — no root loader and no manual data threading:
 *
 * ```tsx
 * export const Route = createRootRoute({
 *   shellComponent: withPayloadRoot(MarketingRoot),
 * })
 * ```
 */
export function withPayloadRoot(
  RootShell: React.ComponentType<{ children: React.ReactNode }>,
  options: WithPayloadRootOptions = {},
) {
  const { adminRoute = '/admin' } = options

  return function PayloadRootShell({ children }: { children: React.ReactNode }) {
    const isAdminRoute = useRouterState({
      select: (s) => {
        const { pathname } = s.location
        return pathname === adminRoute || pathname.startsWith(`${adminRoute}/`)
      },
    })

    if (isAdminRoute) {
      return <PayloadAdminShell>{children}</PayloadAdminShell>
    }

    return <RootShell>{children}</RootShell>
  }
}
