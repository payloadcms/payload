'use client'

import { ShimmerEffect, StaggeredShimmers } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const ShimmerSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="shimmer" selectedComponent={selectedComponent} title="Loading States">
    <Variant label="Single Shimmer">
      <div style={{ height: '24px', width: '200px' }}>
        <ShimmerEffect />
      </div>
    </Variant>

    <Variant label="Staggered Shimmers">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '300px' }}>
        <StaggeredShimmers count={3} />
      </div>
    </Variant>

    <Variant label="Card Skeleton">
      <div
        style={{
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-medium)',
          padding: 'var(--spacer-4)',
          width: '300px',
        }}
      >
        <div style={{ height: '20px', marginBottom: '12px', width: '60%' }}>
          <ShimmerEffect />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ height: '16px', width: '100%' }}>
            <ShimmerEffect />
          </div>
          <div style={{ height: '16px', width: '80%' }}>
            <ShimmerEffect />
          </div>
          <div style={{ height: '16px', width: '90%' }}>
            <ShimmerEffect />
          </div>
        </div>
      </div>
    </Variant>

    <Variant label="Table Row Skeleton">
      <div
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: '40px 1fr 1fr 100px',
          width: '100%',
        }}
      >
        <div style={{ height: '16px' }}>
          <ShimmerEffect />
        </div>
        <div style={{ height: '16px' }}>
          <ShimmerEffect />
        </div>
        <div style={{ height: '16px' }}>
          <ShimmerEffect />
        </div>
        <div style={{ height: '16px' }}>
          <ShimmerEffect />
        </div>
      </div>
    </Variant>
  </Section>
)
