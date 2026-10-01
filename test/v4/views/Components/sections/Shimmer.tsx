'use client'

import { Button, ShimmerEffect } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

const demoColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacer-2)',
  width: '320px',
}

const loadedRowStyle: React.CSSProperties = {
  alignItems: 'center',
  background: 'var(--color-bg-secondary)',
  borderRadius: 'var(--radius-medium)',
  display: 'flex',
  height: '44px',
  paddingInline: 'var(--spacer-3)',
}

const rowLabels = ['Dashboard', 'Collections', 'Globals']

const SimulatedListLoad: React.FC = () => {
  const [loadKey, setLoadKey] = React.useState(1)
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    setIsLoaded(false)
    const timeout = setTimeout(() => setIsLoaded(true), 2500)
    return () => clearTimeout(timeout)
  }, [loadKey])

  return (
    <div style={demoColumnStyle}>
      <Button
        buttonStyle="secondary"
        disabled={!isLoaded}
        onClick={() => setLoadKey((key) => key + 1)}
      >
        {isLoaded ? 'Reload' : 'Loading…'}
      </Button>
      {isLoaded
        ? rowLabels.map((label) => (
            <div key={label} style={loadedRowStyle}>
              {label}
            </div>
          ))
        : rowLabels.map((label, index) => (
            <ShimmerEffect animationDelay={`${index * 120}ms`} height="44px" key={label} />
          ))}
    </div>
  )
}

export const ShimmerSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => {
  return (
    <Section fullWidth id="shimmer" selectedComponent={selectedComponent} title="Shimmer / Loading">
      <Variant label="Default">
        <div style={{ width: '320px' }}>
          <ShimmerEffect />
        </div>
      </Variant>
      <Variant label="Custom sizes">
        <div style={demoColumnStyle}>
          <ShimmerEffect height="80px" />
          <ShimmerEffect height="24px" width="60%" />
          <ShimmerEffect height="16px" width="40%" />
        </div>
      </Variant>
      <Variant label="Simulated content load">
        <SimulatedListLoad />
      </Variant>
    </Section>
  )
}
