import type { Metadata } from 'next'

import { PayloadAdminBar } from '@payloadcms/admin-bar'
import React from 'react'

import { serverURL } from '../../../__helpers/shared/serverURL.js'
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
          cmsURL={serverURL}
          collection="pages"
          devMode
          id="1"
        />
        {children}
      </body>
    </html>
  )
}
