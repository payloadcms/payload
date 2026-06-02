import { RootLayout as UIRootLayout } from '@payloadcms/ui/layouts'
// @ts-expect-error - TS6 NodeNext rejects deep imports into `next` (no `exports` field), but Next.js compiler requires this exact specifier
import { Inter, Roboto_Mono } from 'next/font/google'
import React from 'react'

import { NextRouterAdapter } from './router.js'
import { nextServerAdapter } from './server.js'
// SCSS import lives here (not in `@payloadcms/ui`) so the esbuild bundle that produces
// `@payloadcms/next/css` (`dist/prod/styles.css`) can follow the SCSS chain. esbuild
// treats `@payloadcms/ui` as external; any SCSS import inside that package is invisible
// to it, so the import must be reachable from within `packages/next/src/`.
import '@payloadcms/ui/scss/app.scss'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-family-sans',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-family-mono',
})

const nextDependencyChecks = {
  dependencyVersions: {
    next: {
      required: false,
      version: '>=15.0.0',
    },
  },
}

export { metadata } from '@payloadcms/ui/layouts'

type Props = Omit<
  React.ComponentProps<typeof UIRootLayout>,
  'additionalDependencyChecks' | 'fonts' | 'RouterAdapter' | 'serverAdapter'
>

export const RootLayout = (props: Props) => (
  <UIRootLayout
    {...props}
    additionalDependencyChecks={nextDependencyChecks}
    fonts={[
      { className: inter.className, variable: inter.variable },
      { className: robotoMono.className, variable: robotoMono.variable },
    ]}
    RouterAdapter={NextRouterAdapter}
    serverAdapter={nextServerAdapter}
  />
)
