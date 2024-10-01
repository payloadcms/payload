/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { ClientServerFunction } from 'payload'

import config from '@payload-config'
import { RootLayout } from '@payloadcms/next/layouts'
import { handleServerFunctions } from '@payloadcms/next/utilities'
import React from 'react'

import { importMap } from './admin/importMap.js'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

const serverFunctions: ClientServerFunction = async function (args) {
  'use server'
  return await handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunctions={serverFunctions}>
    {children}
  </RootLayout>
)

export default Layout
