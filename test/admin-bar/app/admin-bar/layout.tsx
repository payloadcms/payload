import type { Metadata } from 'next'

import { PayloadAdminBar } from '@payloadcms/admin-bar'
import React from 'react'

import './app.scss'

export const metadata: Metadata = {
  description: 'Payload Admin Bar',
  title: 'Payload Admin Bar',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PayloadAdminBar
          adminPath="/admin"
          apiPath="/api"
          cmsURL="http://localhost:3000"
          collection="pages"
          devMode
          id="1"
        />
        {children}
      </body>
    </html>
  )
}
