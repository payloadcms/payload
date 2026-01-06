/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
// import '@payloadcms/ui/styles.css' // Uncomment this line if `@payloadcms/ui` in `tsconfig.json` points to `/ui/dist` instead of `/ui/src`

import React from 'react'
import { NavProvider } from './components/context'

type Args = {
  children: React.ReactNode
}

const Layout = ({ children }: Args) => {
  return (
    <html>
      <body>
        <NavProvider initialIsOpen={true}>{children}</NavProvider>
      </body>
    </html>
  )
}

export default Layout
