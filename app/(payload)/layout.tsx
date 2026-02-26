/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { ServerFunctionClient } from 'payload'

import config from '@payload-config'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import rscAdminConfig from '../../test/_community/payload.config.admin.rsc.js'
import { ClientConfigBridge } from './admin/ClientConfigBridge.js'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    adminConfig: rscAdminConfig,
    config,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} rscAdminConfig={rscAdminConfig} serverFunction={serverFunction}>
    <ClientConfigBridge>{children}</ClientConfigBridge>
  </RootLayout>
)

export default Layout
