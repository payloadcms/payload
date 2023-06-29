import React from 'react'
import { Metadata } from 'next'

// import { AdminBar } from '../components/AdminBar'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { fetchGlobals } from '../graphql'
import { Providers } from '../providers'
import { mergeOpenGraph } from '../seo/mergeOpenGraph'

import '../css/app.scss'

import classes from './layout.module.scss'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { header, footer } = await fetchGlobals()

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* <AdminBar
              adminBarProps={{
                collection,
                id,
                preview,
                onPreviewExit,
              }}
            /> */}
        <Providers>
          <Header {...header} />
          <div className={classes.layout}>
            {children}
            <Footer {...footer} />
          </div>
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL),
  openGraph: mergeOpenGraph(),
}
