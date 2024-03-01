/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import React from 'react'
import { DocumentLayout } from '@payloadcms/next/layouts/Document/index'
import configPromise from '@payload-config'

type Args = {
  children: React.ReactNode
  params: {
    global: string
  }
}

const Layout: React.FC<Args> = async ({ children, params }) => (
  <DocumentLayout config={configPromise} globalSlug={params.global}>
    {children}
  </DocumentLayout>
)

export default Layout
