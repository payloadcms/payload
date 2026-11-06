import type { Payload, PayloadRequest } from '../../../types/index.js'
import type { TelemetryWidgetType } from '../widgetType.js'

import { sendTelemetryEvent } from '../index.js'
import { oneWayHash } from '../oneWayHash.js'
import { getTelemetryWidgetType } from '../widgetType.js'

export type DashboardWidgetsEvent = {
  capturedAt: string
  dashboardID: string
  isComplete: boolean
  type: 'dashboard-widgets'
  widgetTypes: TelemetryWidgetType[]
}

/** Report unique configured widget types without their order, widths, names or content. */
export const dashboardWidgets = ({
  layout,
  payload,
  user,
}: {
  layout: { id: string }[]
  payload: Payload
  user: PayloadRequest['user']
}): void => {
  if (payload.config.telemetry === false || !user) {
    return
  }

  try {
    const widgets = payload.config.admin.dashboard?.widgets ?? []
    const widgetTypes = new Set<TelemetryWidgetType>()
    let isComplete = layout.length <= 100

    for (const item of layout.slice(0, 100)) {
      const slug = item.id.slice(0, item.id.lastIndexOf('-'))
      const widget = widgets.find((widget) => widget.slug === slug)
      const type = widget && getTelemetryWidgetType({ component: widget.Component })
      if (type) {
        widgetTypes.add(type)
      } else {
        isComplete = false
      }
    }

    const types = isComplete ? [...widgetTypes].sort() : []
    const dashboardID = oneWayHash(
      JSON.stringify(['dashboard-widgets', user.collection, String(user.id)]),
      payload.secret,
    )
    const hour = Math.floor(Date.now() / 3_600_000)
    let reported = reportedDashboards.get(payload)
    if (reported?.hour !== hour) {
      reported = { hour, signatures: new Map() }
      reportedDashboards.set(payload, reported)
    }
    const signature = JSON.stringify([isComplete, types])
    if (reported.signatures.get(dashboardID) === signature) {
      return
    }
    reported.signatures.set(dashboardID, signature)
    void sendTelemetryEvent({
      event: {
        type: 'dashboard-widgets',
        capturedAt: new Date().toISOString(),
        dashboardID,
        isComplete,
        widgetTypes: types,
      },
      payload,
    })
  } catch (_) {
    // Telemetry must never prevent the dashboard from rendering.
  }
}

// Best-effort suppression is per Payload instance/process and resets each hour.
const reportedDashboards = new WeakMap<Payload, { hour: number; signatures: Map<string, string> }>()
