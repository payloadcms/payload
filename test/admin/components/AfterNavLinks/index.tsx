'use client'

import type { PayloadClientReactComponent, SanitizedConfig } from 'payload'

import LinkImport from 'next/link.js'
const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

import { useConfig } from '@payloadcms/ui'
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
    <div
      className={baseClass}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--base) / 4)',
      }}
    >
      <h4 className="nav__label" style={{ color: 'var(--theme-elevation-400)', margin: 0 }}>
        Custom Routes
      </h4>
      <h4 className="nav__link" style={{ margin: 0 }}>
        <Link href={`${adminRoute}/custom-default-view`} style={{ textDecoration: 'none' }}>
          Default Template
        </Link>
      </h4>
      <h4 className="nav__link" style={{ margin: 0 }}>
        <Link href={`${adminRoute}/custom-minimal-view`} style={{ textDecoration: 'none' }}>
          Minimal Template
        </Link>
      </h4>
      <div id="custom-css" />
    </div>
  )
}
