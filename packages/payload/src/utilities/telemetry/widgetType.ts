import type { PayloadComponent } from '../../config/types.js'

import { parsePayloadComponent } from '../../cli/commands/generateImportMap/utilities/parsePayloadComponent.js'

export type TelemetryWidgetType =
  | 'activity'
  | 'collection-query'
  | 'collections'
  | 'custom'
  | 'upload-dropzone'
  | 'welcome'

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
  ['@payloadcms/ui/rsc#ActivityWidget', 'activity'],
  ['@payloadcms/ui/rsc#CollectionCards', 'collections'],
  ['@payloadcms/ui/rsc#CollectionQueryWidget', 'collection-query'],
  ['@payloadcms/ui/rsc#UploadDropzoneWidget', 'upload-dropzone'],
  ['@payloadcms/ui/rsc#WelcomeWidget', 'welcome'],
])
