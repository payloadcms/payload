import type { ServerFunction, WidgetServerProps } from 'payload'

import { getWidgetControlData } from 'payload/shared'
import React from 'react'

import { RenderServerComponent } from '../../../../../elements/RenderServerComponent/index.js'
import { extractLocaleData } from '../utils/localeUtils.js'

export type RenderWidgetServerFnArgs = {
  /** Render a non-interactive picker preview using server-configured sample data. */
  isPreview?: boolean
  /**
   * Instance-specific data for this widget
   */
  widgetData?: Record<string, unknown>
  /**
   * The slug of the widget to render
   */
  widgetId?: string
  widgetSlug: string
}

export type RenderWidgetServerFnReturnType = {
  component: React.ReactNode
}

/**
 * Server function to render a widget on-demand.
 * Similar to render-field but specifically for dashboard widgets.
 */
export const renderWidgetHandler: ServerFunction<
  RenderWidgetServerFnArgs,
  RenderWidgetServerFnReturnType
> = ({
  cookies,
  isPreview = false,
  locale,
  permissions,
  req,
  user,
  widgetData,
  widgetId,
  widgetSlug,
}) => {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const { widgets } = req.payload.config.admin.dashboard
  const { importMap } = req.payload

  // Find the widget configuration
  const widgetConfig = widgets.find((widget) => widget.slug === widgetSlug)

  if (isPreview && (!widgetConfig || widgetConfig.preview === false)) {
    return { component: null }
  }

  if (!widgetConfig) {
    return {
      component: React.createElement(
        'div',
        {
          style: {
            background: 'var(--color-bg-secondary)',
            border: 'var(--stroke-width-small) solid var(--color-border)',
            borderRadius: 'var(--radius-medium)',
            color: 'var(--color-text)',
            padding: 'var(--spacer-3)',
            textAlign: 'center',
          },
        },
        `Widget "${widgetSlug}" not found`,
      ),
    }
  }

  try {
    const preview = widgetConfig.preview || undefined
    const data = getWidgetControlData({
      controls: widgetConfig.controls,
      data: isPreview ? preview?.data : widgetData,
    })
    const controlData = Object.fromEntries(
      widgetConfig.controls?.map(({ name }) => [name, data[name]]) ?? [],
    )
    const localeFilteredData = widgetConfig.fields?.length
      ? {
          ...(isPreview ? data : controlData),
          ...extractLocaleData(data, req.locale || 'en', widgetConfig.fields),
        }
      : data

    const serverProps: WidgetServerProps = {
      cookies,
      locale,
      permissions,
      req,
      user,
      ...(isPreview ? { isPreview: true } : {}),
      widgetData: localeFilteredData,
      widgetId,
      widgetSlug,
    }

    // Render the widget server component
    const component = RenderServerComponent({
      Component: isPreview
        ? (preview?.Component ?? widgetConfig.Component)
        : widgetConfig.Component,
      ...(isPreview
        ? { clientProps: { isPreview: true, widgetData: localeFilteredData, widgetId, widgetSlug } }
        : {}),
      importMap,
      serverProps,
    })

    return { component }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    req.payload.logger.error({
      err: error,
      msg: `Error rendering widget "${widgetSlug}": ${errorMessage}`,
    })

    if (isPreview) {
      return { component: null }
    }
    return {
      component: React.createElement(
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
        'Error loading widget',
      ),
    }
  }
}
