import { RootLayout as UIRootLayout } from '@payloadcms/ui/layouts'
import { Inter, Roboto_Mono } from 'next/font/google'
import React from 'react'

import { NextRouterAdapter } from './router.js'
import { nextServerAdapter } from './server.js'

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
