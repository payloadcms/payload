'use client'

import type { PayloadClientReactComponent, SanitizedConfig } from 'payload'

import { useConfig } from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import React from 'react'

const Link = 'default' in LinkImport ? LinkImport.default : LinkImport

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
      id="after-nav-links-component"
      style={{
        backgroundColor: 'var(--theme-success-100)',
        borderRadius: 'var(--style-radius-m)',
        color: 'var(--theme-success-750)',
        display: 'flex',
        flexDirection: 'column',
        marginTop: 'var(--base)',
        padding: 'var(--base)',
        width: '100%',
      }}
    >
      <p style={{ marginBottom: '16px', marginTop: 0 }}>afterNavLinks</p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
        }}
      >
        <p className="nav__label" style={{ color: '#1565c0', margin: 0 }}>
          Custom Routes
        </p>
        <p className="nav__link" style={{ margin: 0 }}>
          <Link
            href={`${adminRoute}/custom-default-view`}
            style={{ color: '#1976d2', textDecoration: 'none' }}
          >
            Default Template
          </Link>
        </p>
        <p className="nav__link" style={{ margin: 0 }}>
          <Link
            href={`${adminRoute}/custom-minimal-view`}
            style={{ color: '#1976d2', textDecoration: 'none' }}
          >
            Minimal Template
          </Link>
        </p>
        <div id="custom-css" />
      </div>
    </div>
  )
}
