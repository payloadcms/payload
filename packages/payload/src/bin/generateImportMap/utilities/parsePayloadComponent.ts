// @ts-strict-ignore
import type { PayloadComponent } from '../../../config/types.js'

export function parsePayloadComponent(PayloadComponent: PayloadComponent): {
  exportName: string
  path: string
} {
  if (!PayloadComponent) {
    return null
  }

  const pathAndMaybeExport =
    typeof PayloadComponent === 'string' ? PayloadComponent : PayloadComponent.path

  let path = pathAndMaybeExport
  let exportName = 'default'

  const lastHashIndex = pathAndMaybeExport?.lastIndexOf('#') ?? -1

  if (lastHashIndex > 0) {
    exportName = pathAndMaybeExport.substring(lastHashIndex + 1)
    path = pathAndMaybeExport.substring(0, lastHashIndex)
  }

  if (typeof PayloadComponent === 'object' && PayloadComponent.exportName) {
    exportName = PayloadComponent.exportName
  }

  return { exportName, path }
}
