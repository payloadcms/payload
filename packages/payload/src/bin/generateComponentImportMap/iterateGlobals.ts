import type { SanitizedConfig } from '../../config/types.js'
import type { SanitizedGlobalConfig } from '../../globals/config/types.js'
import type { AddToComponentImportMap, ImportMap, Imports } from './index.js'

import { genComponentImportMapIterateFields } from './iterateFields.js'

export function iterateGlobals({
  addToComponentImportMap,
  baseDir,
  componentMap,
  config,
  globals,
  importMap,
}: {
  addToComponentImportMap: AddToComponentImportMap
  baseDir: string
  componentMap: ImportMap
  config: SanitizedConfig
  globals: SanitizedGlobalConfig[]
  importMap: Imports
}) {
  for (const global of globals) {
    genComponentImportMapIterateFields({
      addToComponentImportMap,
      baseDir,
      componentMap,
      config,
      fields: global.fields,
      importMap,
    })

    addToComponentImportMap(global.admin?.components?.elements?.Description)
    addToComponentImportMap(global.admin?.components?.elements?.PreviewButton)
    addToComponentImportMap(global.admin?.components?.elements?.PublishButton)
    addToComponentImportMap(global.admin?.components?.elements?.SaveButton)
    addToComponentImportMap(global.admin?.components?.elements?.SaveDraftButton)
    if (global.admin?.components?.views?.Edit) {
      for (const editViewConfig of Object.values(global.admin?.components?.views?.Edit)) {
        if ('Component' in editViewConfig) {
          addToComponentImportMap(editViewConfig?.Component)
        }
      }
    }
  }
}
