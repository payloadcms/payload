'use client'
import type { Theme } from '@payloadcms/ui'
import type { RequestThemeSource } from '@payloadcms/ui/utilities/getRequestTheme'

import { ResolveThemeOnClient } from '@payloadcms/ui/layouts/Root/ResolveThemeOnClient'
import { getLanguageDir } from '@payloadcms/ui/utilities/getLanguageDir'
import { HeadContent, Scripts, useRouterState } from '@tanstack/react-router'
import React from 'react'

type AdminHTMLProps = {
  'data-theme'?: Theme
  dir: 'ltr' | 'rtl'
  lang?: string
}

type AdminShellState = {
  htmlProps: AdminHTMLProps
  serverTheme: Theme
  themeSource: RequestThemeSource
}

export type PayloadAdminShellProps = {
  readonly children: React.ReactNode
}

/**
 * The `<html>` document shell for Payload admin routes — the TanStack Start
 * equivalent of `@payloadcms/next`'s root layout `<html>`. Sets
 * `data-theme`/`lang`/`dir` on `<html>` from the server-computed layout data
 * (`getLayoutData`, exposed on the `/_payload` route loader). A blocking script
 * resolves the server's default theme from the browser preference before first paint,
 * while the server-provided language and text direction remain authoritative.
 */
export function PayloadAdminShell({ children }: PayloadAdminShellProps) {
  const { htmlProps, serverTheme, themeSource } = useRouterState({
    select: (state): AdminShellState => {
      for (const match of state.matches) {
        const data = match.loaderData as
          | {
              languageCode?: string
              theme?: Theme
              themeSource?: RequestThemeSource
            }
          | undefined

        if (data?.theme && data?.languageCode) {
          return {
            htmlProps: {
              'data-theme': data.theme,
              dir: getLanguageDir({ languageCode: data.languageCode }),
              lang: data.languageCode,
            },
            serverTheme: data.theme,
            themeSource: data.themeSource ?? 'default',
          }
        }
      }

      // No layout data yet (fresh session before the loader resolves): default
      // to `ltr` so the `[dir='ltr']`-scoped admin layout rules (e.g. the
      // document sidebar divider) still match, matching Next's `ltr` default.
      return {
        htmlProps: { dir: 'ltr' },
        serverTheme: 'light',
        themeSource: 'default',
      }
    },
  })

  return (
    // eslint-disable-next-line jsx-a11y/html-has-lang -- `lang` is set from server-computed layout data when available
    <html {...htmlProps} suppressHydrationWarning>
      <head>
        {themeSource === 'default' && <ResolveThemeOnClient serverTheme={serverTheme} />}
        <style>{`@layer payload-default, payload;`}</style>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
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
