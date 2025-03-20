// @ts-strict-ignore
import type { PayloadComponent } from '../../../config/types.js'

import { extractPathAndExportName } from '../../../utilities/extractPathAndExportName.js'

export function parsePayloadComponent(PayloadComponent: PayloadComponent): {
  exportName: string
  path: string
} {
  if (!PayloadComponent) {
    return null
  }

  const pathAndMaybeExport =
    typeof PayloadComponent === 'string' ? PayloadComponent : PayloadComponent.path

  const { exportName: possibleExport, path } = extractPathAndExportName(
    pathAndMaybeExport,
    'default',
  )

  let exportName = possibleExport
  if (typeof PayloadComponent === 'object' && PayloadComponent.exportName) {
    exportName = PayloadComponent.exportName
  }

  return { exportName, path }
}
