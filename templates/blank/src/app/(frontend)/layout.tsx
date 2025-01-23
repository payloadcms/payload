import React from 'react'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <React.Fragment>{children}</React.Fragment>
      </body>
    </html>
  )
}
