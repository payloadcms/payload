'use client'

import { Banner } from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import React from 'react'

const Link = 'default' in LinkImport ? LinkImport.default : LinkImport

const bannerTypes = ['default', 'error', 'info', 'success', 'warning'] as const

export const BannerStyles: React.FC = () => {
  return (
    <div style={{ padding: 'var(--gutter-h)' }}>
      <Link href="/admin">Dashboard</Link>
      <h1 style={{ marginBottom: 'var(--base)', marginTop: 'var(--base)' }}>Banners</h1>

      <div id="banner-showcase">
        {bannerTypes.map((type) => (
          <Banner key={type} type={type}>
            {type}
          </Banner>
        ))}
      </div>

      <h2 style={{ marginBottom: 'var(--base)', marginTop: 'calc(var(--base) * 2)' }}>
        With Action
      </h2>
      <div
        id="banner-showcase-with-action"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 'calc(var(--base) * 0.5)' }}
      >
        {bannerTypes.map((type) => (
          <Banner key={type} onClick={() => undefined} type={type}>
            {type}
          </Banner>
        ))}
      </div>
    </div>
  )
}
