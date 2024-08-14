import type { SanitizedConfig } from '../../config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { AddToImportMap, Imports, InternalImportMap } from './index.js'

import { genImportMapIterateFields } from './iterateFields.js'

export function iterateGlobals({
  addToImportMap,
  baseDir,
  config,
  globals,
  importMap,
  imports,
}: {
  addToImportMap: AddToImportMap
  baseDir: string
  config: SanitizedConfig
  globals: SanitizedGlobalConfig[]
  importMap: InternalImportMap
  imports: Imports
}) {
  for (const global of globals) {
    genImportMapIterateFields({
      addToImportMap,
      baseDir,
      config,
      fields: global.fields,
      importMap,
      imports,
    })

    addToImportMap(global.admin?.components?.elements?.Description)
    addToImportMap(global.admin?.components?.elements?.PreviewButton)
    addToImportMap(global.admin?.components?.elements?.PublishButton)
    addToImportMap(global.admin?.components?.elements?.SaveButton)
    addToImportMap(global.admin?.components?.elements?.SaveDraftButton)

    if (global.admin?.components?.views?.edit) {
      for (const editViewConfig of Object.values(global.admin?.components?.views?.edit)) {
        if ('Component' in editViewConfig) {
          addToImportMap(editViewConfig?.Component)
        }

        if ('actions' in editViewConfig) {
          addToImportMap(editViewConfig?.actions)
        }

        if ('tab' in editViewConfig) {
          addToImportMap(editViewConfig?.tab?.Component)
          addToImportMap(editViewConfig?.tab?.Pill)
        }
      }
    }
  }
}
