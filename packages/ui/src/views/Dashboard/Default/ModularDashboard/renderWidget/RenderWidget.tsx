'use client'

import React, { startTransition, Suspense, useCallback, useEffect, useRef } from 'react'

import type { RenderWidgetServerFnReturnType } from './renderWidgetServerFn.js'

import { ShimmerEffect } from '../../../../../elements/ShimmerEffect/index.js'
import { useServerFunctions } from '../../../../../providers/ServerFunctions/index.js'

/**
 * Utility to render a widget on-demand on the client.
 */
export const RenderWidget: React.FC<{
  /**
   * Instance-specific data for this widget
   */
  initialComponent?: React.ReactNode
  widgetData?: Record<string, unknown>
  /**
   * Unique ID for this widget instance (format: "slug-timestamp")
   */
  widgetId: string
}> = ({ initialComponent, widgetData, widgetId }) => {
  const [Component, setComponent] = React.useState<React.ReactNode>(initialComponent ?? null)
  const { serverFunction } = useServerFunctions()
  const requestIDRef = useRef(0)

  const renderWidget = useCallback(() => {
    async function render() {
      const requestID = ++requestIDRef.current

      try {
        const widgetSlug = widgetId.slice(0, widgetId.lastIndexOf('-'))

        const result = (await serverFunction({
          name: 'render-widget',
          args: {
            widgetData,
            widgetId,
            widgetSlug,
          },
        })) as RenderWidgetServerFnReturnType

        if (requestID !== requestIDRef.current) {
          return
        }

        startTransition(() => {
          setComponent(result.component)
        })
      } catch (_error) {
        if (requestID !== requestIDRef.current) {
          return
        }

        // Log error but don't expose details to console in production

        // Fallback error component
        setComponent(
          React.createElement(
            'div',
            {
              style: {
                background: 'var(--color-bg-danger-tertiary)',
                border: 'var(--stroke-width-small) solid var(--color-border-danger)',
                borderRadius: 'var(--radius-medium)',
                color: 'var(--color-text-danger)',
                padding: 'var(--spacer-3)',
                textAlign: 'center',
              },
            },
            'Failed to load widget. Please try again later.',
          ),
        )
      }
    }
    void render()
  }, [serverFunction, widgetData, widgetId])

  useEffect(() => {
    void renderWidget()
    return () => {
      requestIDRef.current += 1
    }
  }, [renderWidget])

  if (!Component) {
    return <ShimmerEffect height="100%" />
  }

  return <Suspense fallback={<ShimmerEffect height="100%" />}>{Component}</Suspense>
}
