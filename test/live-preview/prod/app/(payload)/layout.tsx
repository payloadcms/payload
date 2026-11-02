/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. MODIFY AT YOUR OWN RISK. */
import type { ServerFunctionClient } from 'payload'

import config from '@payload-config'
import '@payloadcms/next/css'
import {
  generatePayloadViewport,
  handleServerFunctions,
  RootLayout,
} from '@payloadcms/next/layouts'
import React from 'react'

import { importMap } from './admin/importMap.js'
import './custom.css'

export const generateViewport = generatePayloadViewport

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
