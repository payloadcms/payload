/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
// import '@payloadcms/ui/styles.css' // Uncomment this line if `@payloadcms/ui` in `tsconfig.json` points to `/ui/dist` instead of `/ui/src`

import React from 'react'
import { NavProvider, WindowInfoProvider } from '@payloadcms/ui'

type Args = {
  children: React.ReactNode
}

const Layout = ({ children }: Args) => {
  return (
    <html>
      <body>
        <WindowInfoProvider
          breakpoints={{
            l: '(max-width: 1440px)',
            m: '(max-width: 1024px)',
            s: '(max-width: 768px)',
            xs: '(max-width: 400px)',
          }}
        >
          <NavProvider initialIsOpen={true}>{children}</NavProvider>
        </WindowInfoProvider>
      </body>
    </html>
  )
}

export default Layout
