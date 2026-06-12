'use client'

import type { PayloadClientReactComponent, SanitizedConfig } from 'payload'

import { useConfig } from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import React from 'react'

const Link = 'default' in LinkImport ? LinkImport.default : LinkImport

export const AfterNavLinks: PayloadClientReactComponent<
  SanitizedConfig['admin']['components']['afterNavLinks'][0]
> = () => {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  return (
    <div style={{ marginTop: 'var(--base)', padding: '0 var(--base)', width: '100%' }}>
      <Link
        href={`${adminRoute}/upload-form-test`}
        style={{ color: 'var(--theme-text)', textDecoration: 'none' }}
      >
        Upload Form Test
      </Link>
    </div>
  )
}
