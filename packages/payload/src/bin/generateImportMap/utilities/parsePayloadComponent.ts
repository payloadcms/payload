import type { PayloadComponent } from '../../../config/types.js'

export function parsePayloadComponent(PayloadComponent: PayloadComponent): {
  exportName: string
  path: string
} {
  if (!PayloadComponent) {
    return null!
  }

  const pathAndMaybeExport =
    typeof PayloadComponent === 'string' ? PayloadComponent : PayloadComponent.path

  let path: string
  let exportName: string

  if (pathAndMaybeExport.includes('#')) {
    ;[path, exportName] = pathAndMaybeExport.split('#', 2) as [string, string]
  } else {
    path = pathAndMaybeExport
    exportName = 'default'
  }

  if (typeof PayloadComponent === 'object' && PayloadComponent.exportName) {
    exportName = PayloadComponent.exportName
  }

  return { exportName, path }
}
