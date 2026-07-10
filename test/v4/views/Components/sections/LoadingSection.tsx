'use client'

import { LoadingOverlay } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

import { Section, Variant } from '../shared.js'

const containerStyle: React.CSSProperties = {
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-medium)',
  height: '200px',
  overflow: 'hidden',
  position: 'relative',
  width: '100%',
}

const buttonStyle: React.CSSProperties = {
  background: 'var(--bg-default-secondary)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-medium)',
  color: 'var(--text-default)',
  cursor: 'pointer',
  padding: 'var(--spacer-2) var(--spacer-4)',
}

export const LoadingSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => {
  const [showDefault, setShowDefault] = useState(false)
  const [showCustomText, setShowCustomText] = useState(false)
  const [showFast, setShowFast] = useState(false)

  const triggerLoading = useCallback(
    (setter: React.Dispatch<React.SetStateAction<boolean>>, duration: number) => {
      setter(true)
      setTimeout(() => setter(false), duration)
    },
    [],
  )

  return (
    <Section id="loading-overlay" selectedComponent={selectedComponent} title="Loading Overlay">
      <Variant label="Default">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacer-3)' }}>
          <button
            disabled={showDefault}
            onClick={() => triggerLoading(setShowDefault, 2000)}
            style={buttonStyle}
          >
            {showDefault ? 'Loading...' : 'Show Loading (2s)'}
          </button>
          <LoadingOverlay show={showDefault} />
        </div>
      </Variant>

      <Variant label="Custom Loading Text">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacer-3)' }}>
          <button
            disabled={showCustomText}
            onClick={() => triggerLoading(setShowCustomText, 2000)}
            style={buttonStyle}
          >
            {showCustomText ? 'Processing...' : 'Show Loading (2s)'}
          </button>
          <LoadingOverlay loadingText="Processing..." show={showCustomText} />
        </div>
      </Variant>

      <Variant label="Fast Animation">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacer-3)' }}>
          <button
            disabled={showFast}
            onClick={() => triggerLoading(setShowFast, 1500)}
            style={buttonStyle}
          >
            {showFast ? 'Loading...' : 'Show Loading (1.5s)'}
          </button>
          <LoadingOverlay animationDuration="200ms" show={showFast} />
        </div>
      </Variant>
    </Section>
  )
}
