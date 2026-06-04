'use client'

import { Button, ProgressBar, RouteTransitionProvider, useRouteTransition } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

// Suspends for ~2.5s per trigger so the route-transition-driven ProgressBar animates to completion.
const promises: Record<number, Promise<void>> = {}

const getTransitionPromise = (id: number): Promise<void> => {
  const existing = promises[id]

  if (existing) {
    return existing
  }

  const promise = new Promise<void>((resolve) => setTimeout(resolve, 2500))
  promises[id] = promise
  return promise
}

const Suspender: React.FC<{ id: number }> = ({ id }) => {
  if (id) {
    React.use(getTransitionPromise(id))
  }

  return null
}

const ProgressBarDemo: React.FC = () => {
  const { isTransitioning, startRouteTransition } = useRouteTransition()
  const [triggerKey, setTriggerKey] = React.useState(0)

  return (
    <Variant>
      <Button
        buttonStyle="secondary"
        disabled={isTransitioning}
        onClick={() => startRouteTransition(() => setTriggerKey((key) => key + 1))}
      >
        Trigger
      </Button>
      <ProgressBar />
      <React.Suspense fallback={null}>
        <Suspender id={triggerKey} />
      </React.Suspense>
    </Variant>
  )
}

export const ProgressBarSection: React.FC<{ selectedComponent: string }> = ({
  selectedComponent,
}) => (
  <Section id="progress-bar" selectedComponent={selectedComponent} title="Progress Bar">
    <RouteTransitionProvider>
      <ProgressBarDemo />
    </RouteTransitionProvider>
  </Section>
)
