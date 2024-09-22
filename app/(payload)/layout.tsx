/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import type { PayloadServerAction } from 'payload'

import config from '@payload-config'
import { RootLayout } from '@payloadcms/next/layouts'
// import '@payloadcms/ui/styles.css' // Uncomment this line if `@payloadcms/ui` in `tsconfig.json` points to `/ui/dist` instead of `/ui/src`
import { handleServerActions } from '@payloadcms/next/utilities'
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import React from 'react'

import { importMap } from './admin/importMap.js'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

const payloadServerAction: PayloadServerAction = async function (action, args) {
  'use server'
  return handleServerActions(action, {
    config,
    importMap,
    ...(args || {}),
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} payloadServerAction={payloadServerAction}>
    {children}
  </RootLayout>
)

export default Layout
