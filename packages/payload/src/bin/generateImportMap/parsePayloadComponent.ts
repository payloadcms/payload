// @ts-strict-ignore
import type { PayloadComponent } from '../../config/types.js'

export function parsePayloadComponent(PayloadComponent: PayloadComponent): {
  exportName: string
  path: string
} {
  if (!PayloadComponent) {
    return null
  }

  const pathAndMaybeExport =
    typeof PayloadComponent === 'string' ? PayloadComponent : PayloadComponent.path

  let path = ''
  let exportName = 'default'

  const exportSplitIndex = pathAndMaybeExport?.lastIndexOf('#') ?? -1;
  if (exportSplitIndex > 0) {
    path = pathAndMaybeExport.substring(0, exportSplitIndex)
    exportName = pathAndMaybeExport.substring(exportSplitIndex + 1)
  } else {
    path = pathAndMaybeExport
  }

  if (typeof PayloadComponent === 'object' && PayloadComponent.exportName) {
    exportName = PayloadComponent.exportName
  }

  return { exportName, path }
}
