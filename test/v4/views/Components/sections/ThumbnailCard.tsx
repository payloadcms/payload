'use client'

import { ThumbnailCard } from '@payloadcms/ui'
import React from 'react'

import { Section } from '../shared.js'

const PlaceholderThumbnail: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div
    style={{
      alignItems: 'center',
      background: color,
      display: 'flex',
      height: '100%',
      justifyContent: 'center',
      width: '100%',
    }}
  >
    <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>{label}</span>
  </div>
)

export const ThumbnailCardSection: React.FC<{ selectedComponent: string }> = ({
  selectedComponent,
}) => {
  return (
    <Section id="thumbnail-card" selectedComponent={selectedComponent} title="Thumbnail Cards">
      <ThumbnailCard
        label="image.jpg"
        onClick={() => {}}
        thumbnail={<PlaceholderThumbnail color="#F5F5F5" label="IMG" />}
      />
      <ThumbnailCard
        label="image-hover.jpg"
        onClick={() => {}}
        thumbnail={<PlaceholderThumbnail color="#F5F5F5" label="IMG" />}
      />
      <ThumbnailCard
        isSelected
        label="image-selected.jpg"
        onClick={() => {}}
        thumbnail={<PlaceholderThumbnail color="#F5F5F5" label="IMG" />}
      />
    </Section>
  )
}
