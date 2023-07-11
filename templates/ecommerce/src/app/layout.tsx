import React from 'react'

import { AdminBar } from './_components/AdminBar'
import { Footer } from './_components/Footer'
import { Header } from './_components/Header'
import { Providers } from './_providers'
import { fetchGlobals } from './cms'

import './_css/app.scss'

export const metadata = {
  title: 'Payload E-commerce Template',
  description: 'Use Payload to build an online store',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { header, footer } = await fetchGlobals()

  return (
    <html lang="en">
      <body>
        <Providers>
          {/* <AdminBar
            adminBarProps={{
              collection,
              id,
              preview,
              onPreviewExit,
            }}
          /> */}
          <Header header={header} />
          {children}
          <Footer footer={footer} />
        </Providers>
      </body>
    </html>
  )
}
