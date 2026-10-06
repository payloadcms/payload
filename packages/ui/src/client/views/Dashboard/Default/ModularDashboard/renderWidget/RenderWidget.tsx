'use client'

import React, { useCallback, useEffect, useRef } from 'react'

import type {
  RenderWidgetServerFnArgs,
  RenderWidgetServerFnReturnType,
} from './renderWidgetServerFn.js'

import { ShimmerEffect } from '../../../../../elements/ShimmerEffect/index.js'
import { useServerFunctions } from '../../../../../providers/ServerFunctions/index.js'

/**
 * Utility to render a widget on-demand on the client.
 */
export const RenderWidget: React.FC<{
  /**
   * Instance-specific data for this widget
   */
  widgetData?: Record<string, unknown>
  /**
   * Unique ID for this widget instance (format: "slug-timestamp")
   */
  widgetId: string
}> = ({ widgetData, widgetId }) => {
  const [Component, setComponent] = React.useState<null | React.ReactNode>(null)
  const { serverFunction } = useServerFunctions()
  const requestIDRef = useRef(0)

  const renderWidget = useCallback(() => {
    async function render() {
      const requestID = ++requestIDRef.current
      setComponent(null)

      try {
        const widgetSlug = widgetId.slice(0, widgetId.lastIndexOf('-'))

        const result = (await serverFunction({
          name: 'render-widget',
          args: {
            widgetData,
            widgetSlug,
          } as RenderWidgetServerFnArgs,
        })) as RenderWidgetServerFnReturnType

        if (requestID !== requestIDRef.current) {
          return
        }

        setComponent(result.component)
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
  }, [renderWidget])

  if (!Component) {
    return <ShimmerEffect height="100%" />
  }

  return <>{Component}</>
}
