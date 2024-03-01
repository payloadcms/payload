/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import React from 'react'
import { DocumentLayout } from '@payloadcms/next/layouts/Document/index'
import configPromise from '@payload-config'

type Args = {
  children: React.ReactNode
  params: {
    collection: string
  }
}

const Layout: React.FC<Args> = async ({ children, params }: Args) => (
  <DocumentLayout config={configPromise} collectionSlug={params.collection}>
    {children}
  </DocumentLayout>
)

export default Layout
