'use client'
import type { AdminViewClientProps } from 'payload'

import { useConfig } from '@payloadcms/ui'
import React from 'react'

import { customCollectionViewClientTitle } from '../../../shared.js'

export function CustomCollectionViewClient({ collectionSlug }: AdminViewClientProps) {
  const { getEntityConfig } = useConfig()

  if (!collectionSlug) {
    return null
  }

  const clientCollectionConfig = getEntityConfig({ collectionSlug })

  if (!clientCollectionConfig) {
    return null
  }

  const { labels } = clientCollectionConfig

  return (
    <div
      style={{
        marginTop: 'calc(var(--base) * 2)',
        paddingLeft: 'var(--gutter-h)',
        paddingRight: 'var(--gutter-h)',
      }}
    >
      <h1 id="custom-collection-view-client-title">{customCollectionViewClientTitle}</h1>
      <p id="custom-collection-view-client-slug">{clientCollectionConfig.slug}</p>
      <p id="custom-collection-view-client-label">{String(labels?.plural)}</p>
    </div>
  )
}
