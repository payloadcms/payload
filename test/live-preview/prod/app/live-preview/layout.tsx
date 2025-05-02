import type { Metadata } from 'next'

import React from 'react'

import { Footer } from './_components/Footer/index.js'
import { Header } from './_components/Header/index.js'
import './_css/app.scss'

export const metadata: Metadata = {
  description: 'Payload Live Preview',
  title: 'Payload Live Preview',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
