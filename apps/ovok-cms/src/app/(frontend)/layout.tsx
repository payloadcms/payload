import React from 'react'

export const metadata = {
  description: 'Ovok CMS — Payload backend for the Ovok platform.',
  title: 'Ovok CMS',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
