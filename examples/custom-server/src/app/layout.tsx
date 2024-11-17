import Link from 'next/link'
import React from 'react'

import './app.scss'
import classes from './layout.module.scss'

export const metadata = {
  description: 'Serve Payload alongside any front-end framework.',
  title: 'Payload Custom Server',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={classes.body}>
        <header className={classes.header}>
          <Link href="https://payloadcms.com" rel="noopener noreferrer" target="_blank">
            <picture>
              <source
                media="(prefers-color-scheme: dark)"
                srcSet="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-logo-light.svg"
              />
              <img
                alt="Payload Logo"
                className={classes.logo}
                src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-logo-dark.svg"
              />
            </picture>
          </Link>
        </header>
        {children}
      </body>
    </html>
  )
}
