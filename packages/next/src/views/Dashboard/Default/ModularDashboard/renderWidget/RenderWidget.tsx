'use client'

import { ShimmerEffect, useServerFunctions } from '@payloadcms/ui'
import React, { useCallback, useEffect, useRef } from 'react'

import type {
  RenderWidgetServerFnArgs,
  RenderWidgetServerFnReturnType,
} from './renderWidgetServerFn.js'

/**
 * Utility to render a widget on-demand on the client.
 */
export const RenderWidget: React.FC<{
  /**
   * Instance-specific data for this widget
   */
  // TODO: widgetData?: Record<string, unknown>
  /**
   * Unique ID for this widget instance (format: "slug-timestamp")
   */
  widgetId: string
}> = ({ /* widgetData, */ widgetId }) => {
  const [Component, setComponent] = React.useState<null | React.ReactNode>(null)
  const { serverFunction } = useServerFunctions()

  const renderWidget = useCallback(() => {
    async function render() {
      try {
        const widgetSlug = widgetId.slice(0, widgetId.lastIndexOf('-'))

        const result = (await serverFunction({
          name: 'render-widget',
          args: {
            // TODO: widgets will support state in the future
            // widgetData,
            widgetSlug,
          } as RenderWidgetServerFnArgs,
        })) as RenderWidgetServerFnReturnType

        setComponent(result.component)
      } catch (error) {
        // Log error but don't expose details to console in production

        // Fallback error component
        setComponent(
          React.createElement(
            'div',
            {
              style: {
                background: 'var(--theme-error-50)',
                border: '1px solid var(--theme-error-200)',
                borderRadius: '4px',
                color: 'var(--theme-error-text)',
                padding: '20px',
                textAlign: 'center',
              },
            },
            'Failed to load widget. Please try again later.',
          ),
        )
      }
    }
    void render()
  }, [serverFunction, widgetId /* widgetData, */])

  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) {
      return
    }
    mounted.current = true
    void renderWidget()
  }, [renderWidget])

  if (!Component) {
    return <ShimmerEffect height="100%" />
  }

  return <>{Component}</>
}
