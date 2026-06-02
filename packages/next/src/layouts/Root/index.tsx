import { RootLayout as UIRootLayout } from '@payloadcms/ui/layouts'
// @ts-expect-error - TS6 NodeNext rejects deep imports into `next` (no `exports` field), but Next.js compiler requires this exact specifier
import { Inter, Roboto_Mono } from 'next/font/google'
import React from 'react'

import { NextRouterAdapter } from '../../adapters/router.js'
import { nextServerAdapter } from '../../adapters/server.js'
import { checkDependencies } from './checkDependencies.js'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-family-sans',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-family-mono',
})

export { metadata } from '@payloadcms/ui/layouts'

type Props = Omit<
  React.ComponentProps<typeof UIRootLayout>,
  'fonts' | 'RouterAdapter' | 'serverAdapter'
>

export const RootLayout = (props: Props) => {
  checkDependencies()

  return (
    <UIRootLayout
      {...props}
      fonts={[
        { className: inter.className, variable: inter.variable },
        { className: robotoMono.className, variable: robotoMono.variable },
      ]}
      RouterAdapter={NextRouterAdapter}
      serverAdapter={nextServerAdapter}
    />
  )
}
