/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
// import '@payloadcms/ui/styles.css' // Uncomment this line if `@payloadcms/ui` in `tsconfig.json` points to `/ui/dist` instead of `/ui/src`
import type { ServerFunctionClient } from 'payload'

import config from '@payload-config'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { importMap } from './admin/importMap.js'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
