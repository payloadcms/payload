/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import configPromise from '@payload-config'
import { RootLayout } from '@payloadcms/next/layouts'
// import '@payloadcms/ui/styles.css' // Uncomment this line if `@payloadcms/ui` in `tsconfig.json` points to `/ui/dist` instead of `/ui/src`
import React from 'react'

import { importMap } from './admin/importMap.js'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

const Layout = ({ children }: Args) => (
  <RootLayout config={configPromise} importMap={importMap}>
    {children}
  </RootLayout>
)

export default Layout
