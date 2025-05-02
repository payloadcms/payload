'use client'

import type { PayloadClientReactComponent, SanitizedConfig } from 'payload'

import { NavGroup, useConfig } from '@payloadcms/ui'
import LinkImport from 'next/link.js'
const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default
import React from 'react'

const baseClass = 'after-nav-links'

export const AfterNavLinks: PayloadClientReactComponent<
  SanitizedConfig['admin']['components']['afterNavLinks'][0]
> = () => {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  return (
    <NavGroup key="extra-links" label="Extra Links">
      {/* Open link to payload admin url */}
      {/* <Link href={`${adminRoute}/collections/uploads`}>Internal Payload Admin Link</Link> */}
      {/* Open link to payload admin url with prefiltered query */}
      <Link href={`${adminRoute}/collections/uploads?page=1&search=jpg&limit=10`}>
        Prefiltered Media
      </Link>
    </NavGroup>
  )
}
