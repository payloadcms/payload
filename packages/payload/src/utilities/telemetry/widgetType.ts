import type { PayloadComponent } from '../../config/types.js'

import { parsePayloadComponent } from '../../bin/generateImportMap/utilities/parsePayloadComponent.js'

export type TelemetryWidgetType = 'collections' | 'custom'

export const getTelemetryWidgetType = ({
  component,
}: {
  component: PayloadComponent
}): null | TelemetryWidgetType => {
  if (!component) {
    return null
  }
  const { exportName, path } = parsePayloadComponent(component)
  const reference = exportName === 'default' ? path : `${path}#${exportName}`

  return SYSTEM_WIDGET_TYPES.get(reference) ?? 'custom'
}

const SYSTEM_WIDGET_TYPES = new Map<string, TelemetryWidgetType>([
  ['@payloadcms/next/rsc#CollectionCards', 'collections'],
])
