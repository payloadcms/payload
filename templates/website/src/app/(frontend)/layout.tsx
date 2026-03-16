import type { Metadata } from 'next'
import { cookies, draftMode } from 'next/headers'

import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

import { Providers } from '@/providers'
import { themeIsValid, themeStorageKey } from '@/providers/Theme/shared'

import { cn } from '@/utils/cn'
import { mergeOpenGraph } from '@/utils/mergeOpenGraph'
import { getServerSideURL } from '@/utils/getURL'

import './globals.css'
import { Theme } from '@/providers/Theme/types'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const themeCookie = (await cookies()).get(themeStorageKey)?.value
  const initialTheme = themeCookie && themeIsValid(themeCookie) ? (themeCookie as Theme) : null

  return (
    <html
      lang="en"
      className={cn(GeistSans.variable, GeistMono.variable)}
      data-theme={initialTheme ?? 'system'}
    >
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers initialTheme={initialTheme}>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: {
    template: `%s | ${process.env.SITE_METATITLE || 'Payload Website Template'}`,
    default: `${process.env.SITE_METATITLE || 'Payload Website Template'}`,
  },
  metadataBase: new URL(getServerSideURL()!),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}
