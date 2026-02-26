/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { ServerFunctionClient } from 'payload'

import config from '@payload-config'
import '@payloadcms/next/css'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import './custom.scss'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} serverFunction={serverFunction}>
    {children}
    <div
      style={{
        background: 'red',
        color: 'white',
        padding: 10,
        position: 'fixed',
        bottom: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      LAYOUT TEST
    </div>
  </RootLayout>
)

export default Layout
