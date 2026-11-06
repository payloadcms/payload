import type { Payload } from '../../../types/index.js'
import type { TelemetryWidgetType } from '../widgetType.js'

import { sendEvent } from '../index.js'
import { getTelemetryWidgetType } from '../widgetType.js'

export type DashboardWidgetsEvent = {
  type: 'dashboard-widgets'
  widgetTypes: TelemetryWidgetType[]
}

/** Report unique configured widget types without dashboard or project identifiers. */
export const dashboardWidgets = ({
  layout,
  payload,
}: {
  layout: { id: string }[]
  payload: Payload
}): void => {
  if (payload.config.telemetry === false || layout.length > 100) {
    return
  }

  try {
    const widgets = payload.config.admin.dashboard?.widgets ?? []
    const widgetTypes = new Set<TelemetryWidgetType>()

    for (const item of layout) {
      const slug = item.id.slice(0, item.id.lastIndexOf('-'))
      const widget = widgets.find((widget) => widget.slug === slug)
      const type = widget && getTelemetryWidgetType({ component: widget.Component })
      if (!type) {
        return
      }
      widgetTypes.add(type)
    }

    void sendEvent({
      event: { type: 'dashboard-widgets', widgetTypes: [...widgetTypes].sort() },
      payload,
    })
  } catch (_) {
    // Telemetry must never prevent the dashboard from rendering.
  }
}
