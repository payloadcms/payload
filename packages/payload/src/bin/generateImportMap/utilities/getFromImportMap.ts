import type { PayloadComponent } from '../../../config/types.js'
import type { ImportMap } from '../index.js'

import { parsePayloadComponent } from './parsePayloadComponent.js'

export const getFromImportMap = <TOutput>(args: {
  importMap: ImportMap
  PayloadComponent: PayloadComponent
  schemaPath?: string
  silent?: boolean
}): TOutput => {
  const { importMap, PayloadComponent, schemaPath, silent } = args

  const { exportName, path } = parsePayloadComponent(PayloadComponent)

  const key = path + '#' + exportName

  const importMapEntry = importMap[key]

  if (!importMapEntry && !silent) {
    // eslint-disable-next-line no-console
    console.error(
      `getFromImportMap: PayloadComponent not found in importMap`,
      {
        key,
        PayloadComponent,
        schemaPath,
      },
      'You may need to run the `payload generate:importmap` command to generate the importMap ahead of runtime.',
    )
  }

  return importMapEntry
}
