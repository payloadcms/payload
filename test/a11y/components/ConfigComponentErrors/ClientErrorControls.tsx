'use client'

import type { PropsWithChildren } from 'react'

import { Button, ConfigComponentErrorBoundary, RenderCustomComponent } from '@payloadcms/ui'
import React, { useState } from 'react'

export function ClientErrorControls({ children }: PropsWithChildren) {
  const [shouldThrow, setShouldThrow] = useState(false)
  const [instanceKey, setInstanceKey] = useState(0)

  return (
    <div>
      <h1>Configured component error isolation</h1>
      <label htmlFor="error-isolation-sibling">Sibling input</label>
      <input aria-label="Sibling input" id="error-isolation-sibling" />
      <Button buttonStyle="secondary" onClick={() => setShouldThrow(true)}>
        Trigger component error
      </Button>
      <Button
        buttonStyle="secondary"
        onClick={() => {
          setShouldThrow(false)
          setInstanceKey((key) => key + 1)
        }}
      >
        Reset component instance
      </Button>
      <section aria-label="Client component errors">
        <ConfigComponentErrorBoundary
          componentName="test client slot"
          instanceKey={instanceKey}
          key={instanceKey}
        >
          <RenderCustomComponent
            CustomComponent={<ThrowingClientComponent shouldThrow={shouldThrow} />}
            Fallback={<button type="button">Must not substitute action</button>}
          />
        </ConfigComponentErrorBoundary>
      </section>
      {children}
    </div>
  )
}

function ThrowingClientComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Client component failed')
  }

  return <p>Healthy client component</p>
}
