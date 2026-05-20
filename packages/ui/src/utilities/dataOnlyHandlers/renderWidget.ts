import type { Field, ServerFunction } from 'payload'

import { extractLocaleData } from '../../views/Dashboard/Default/ModularDashboard/utils/localeUtils.js'

export type RenderWidgetDataOnlyResult = {
  widgetConfig: {
    maxWidth?: string
    minWidth?: string
    slug: string
  }
  widgetData: Record<string, unknown>
}

/**
 * Data-only alternative to `renderWidgetHandler`.
 * Returns widget config metadata + filtered data instead of rendered JSX.
 * The client renders the component using import map resolution.
 */
export const renderWidgetDataOnlyHandler: ServerFunction<
  {
    widgetData?: Record<string, unknown>
    widgetSlug: string
  },
  RenderWidgetDataOnlyResult
> = ({ req, widgetData, widgetSlug }) => {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const { widgets } = req.payload.config.admin.dashboard

  const widgetConfig = widgets.find((widget) => widget.slug === widgetSlug)

  if (!widgetConfig) {
    throw new Error(`Widget "${widgetSlug}" not found`)
  }

  const localeFilteredData = widgetConfig.fields?.length
    ? extractLocaleData(widgetData || {}, req.locale || 'en', widgetConfig.fields as Field[])
    : widgetData || {}

  return {
    widgetConfig: {
      slug: widgetConfig.slug,
      maxWidth: widgetConfig.maxWidth,
      minWidth: widgetConfig.minWidth,
    },
    widgetData: localeFilteredData,
  }
}
