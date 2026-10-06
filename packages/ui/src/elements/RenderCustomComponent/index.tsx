'use client'

import React from 'react'

import { ConfigComponentErrorBoundary } from '../ConfigComponentErrorBoundary/index.js'

type Args = {
  CustomComponent?: React.ReactNode
  Fallback: React.ReactNode
  /** Use only for passive slots with a compatible built-in replacement. */
  shouldUseFallbackOnError?: boolean
}

/**
 * Renders a CustomComponent or a Fallback component.
 * Only fallback if the Custom Component is undefined.
 *
 * If the CustomComponent is null, render null.
 *
 * @param {Object} args - Arguments object.
 * @param {React.ReactNode} [args.CustomComponent] - Optional custom component to render.
 * @param {React.ReactNode} args.Fallback - Fallback component to render if CustomComponent is undefined.
 * @returns {React.ReactNode} Rendered component.
 */
export function RenderCustomComponent({
  CustomComponent,
  Fallback,
  shouldUseFallbackOnError = false,
}: Args): React.ReactNode {
  if (CustomComponent === undefined) {
    return Fallback
  }

  if (CustomComponent === null) {
    return null
  }

  return (
    <ConfigComponentErrorBoundary
      componentName="custom component slot"
      errorFallback={shouldUseFallbackOnError ? Fallback : undefined}
    >
      {CustomComponent}
    </ConfigComponentErrorBoundary>
  )
}
