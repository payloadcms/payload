import React from 'react'

import { Footer } from './_components/Footer'
import { Header } from './_components/Header'
import { Providers } from './_providers'

import './_css/app.scss'

export const metadata = {
  title: 'Payload E-commerce Template',
  description: 'Use Payload to build an online store',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
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
          {/* @ts-expect-error */}
          <Header />
          {children}
          {/* @ts-expect-error */}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
