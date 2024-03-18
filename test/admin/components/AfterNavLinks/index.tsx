'use client'

import LinkImport from 'next/link.js'
const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

import React from 'react'

// As this is the demo project, we import our dependencies from the `src` directory.
import { useConfig } from '../../../../packages/ui/src/providers/Config/index.js'

// In your projects, you can import as follows:
// import { useConfig } from 'payload/components/utilities';

const baseClass = 'after-nav-links'

export const AfterNavLinks: React.FC = () => {
  const {
    routes: { admin: adminRoute },
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
