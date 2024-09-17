import type { PayloadComponent } from '../../config/types.js'

export function parsePayloadComponent(payloadComponent: PayloadComponent): {
  exportName: string
  path: string
} {
  if (!payloadComponent) {
    return null
  }
  const pathAndMaybeExport =
    typeof payloadComponent === 'string' ? payloadComponent : payloadComponent.path

  let path = ''
  let exportName = 'default'

  if (pathAndMaybeExport?.includes('#')) {
    ;[path, exportName] = pathAndMaybeExport.split('#')
  } else {
    path = pathAndMaybeExport
  }

  if (typeof payloadComponent === 'object' && payloadComponent.exportName) {
    exportName = payloadComponent.exportName
  }

  return { exportName, path }
}
