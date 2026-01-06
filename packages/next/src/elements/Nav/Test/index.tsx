'use client'

import type { PayloadClientReactComponent, SanitizedConfig } from 'payload'

import React from 'react'

const baseClass = 'after-nav-links'

export const AfterNavLinks: PayloadClientReactComponent<
  SanitizedConfig['admin']['components']['afterNavLinks'][0]
> = () => {
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
        fwef
      </h4>
      <h4 className="nav__link" style={{ margin: 0 }}>
        fewf
      </h4>
      <div id="custom-css" />
    </div>
  )
}
