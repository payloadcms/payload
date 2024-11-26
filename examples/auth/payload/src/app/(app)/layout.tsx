/* eslint-disable no-restricted-exports */
import React from 'react'

import { Header } from './_components/Header'
import { AuthProvider } from './_providers/Auth'
import { auth } from './auth'
import './_css/app.scss'

export const metadata = {
  description: 'An example of how to authenticate with Payload from a Next.js app.',
  title: 'Payload Auth + Next.js App Router Example',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { permissions, user } = await auth()

  return (
    <html lang="en">
      <body>
        <AuthProvider permissions={permissions} user={user}>
          <Header />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
