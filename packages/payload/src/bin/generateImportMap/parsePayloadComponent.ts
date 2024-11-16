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

  if (pathAndMaybeExport?.includes('#')) {
    const split = pathAndMaybeExport.split('#')
    path = split[0]
    exportName = split[1]
  } else {
    path = pathAndMaybeExport
  }

  if (typeof PayloadComponent === 'object' && PayloadComponent.exportName) {
    exportName = PayloadComponent.exportName
  }

  return { exportName, path }
}
