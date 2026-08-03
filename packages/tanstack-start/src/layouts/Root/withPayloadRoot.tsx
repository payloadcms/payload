'use client'
import type { Theme } from '@payloadcms/ui'

import { getLanguageDir } from '@payloadcms/ui/utilities/getLanguageDir'
import { HeadContent, Scripts, useRouterState } from '@tanstack/react-router'
import React from 'react'

type AdminHTMLProps = {
  'data-theme'?: Theme
  dir: 'ltr' | 'rtl'
  lang?: string
}

export type PayloadAdminShellProps = {
  readonly children: React.ReactNode
}

/**
 * The `<html>` document shell for Payload admin routes — the TanStack Start
 * equivalent of `@payloadcms/next`'s root layout `<html>`. Sets
 * `data-theme`/`lang`/`dir` on `<html>` from the server-computed layout data
 * (`getLayoutData`, exposed on the `/_payload` route loader), so the admin
 * panel renders themed with the correct text direction on the first paint with no
 * client bootstrap script — the same server-side path Next's `RootLayout`
 * uses, sharing `getRequestTheme`/`getLanguageDir` from `@payloadcms/ui`.
 */
export function PayloadAdminShell({ children }: PayloadAdminShellProps) {
  const htmlProps = useRouterState({
    select: (state): AdminHTMLProps => {
      for (const match of state.matches) {
        const data = match.loaderData as { languageCode?: string; theme?: Theme } | undefined

        if (data?.theme && data?.languageCode) {
          return {
            'data-theme': data.theme,
            dir: getLanguageDir({ languageCode: data.languageCode }),
            lang: data.languageCode,
          }
        }
      }

      // No layout data yet (fresh session before the loader resolves): default
      // to `ltr` so the `[dir='ltr']`-scoped admin layout rules (e.g. the
      // document sidebar divider) still match, matching Next's `ltr` default.
      return { dir: 'ltr' }
    },
  })

  return (
    // eslint-disable-next-line jsx-a11y/html-has-lang -- `lang` is set from server-computed layout data when available
    <html {...htmlProps} suppressHydrationWarning>
      <head>
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
