import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { AddToImportMap, Imports, InternalImportMap } from './index.js'

import { genImportMapIterateFields } from './iterateFields.js'

export function iterateCollections({
  addToImportMap,
  baseDir,
  collections,
  config,
  importMap,
  imports,
}: {
  addToImportMap: AddToImportMap
  baseDir: string
  collections: SanitizedCollectionConfig[]
  config: SanitizedConfig
  importMap: InternalImportMap
  imports: Imports
}) {
  for (const collection of collections) {
    genImportMapIterateFields({
      addToImportMap,
      baseDir,
      config,
      fields: collection.fields,
      importMap,
      imports,
    })

    addToImportMap(collection.admin?.components?.afterList)
    addToImportMap(collection.admin?.components?.listMenuItems)
    addToImportMap(collection.admin?.components?.afterListTable)
    addToImportMap(collection.admin?.components?.beforeList)
    addToImportMap(collection.admin?.components?.beforeListTable)
    addToImportMap(collection.admin?.components?.Description)

    addToImportMap(collection.admin?.components?.edit?.PreviewButton)
    addToImportMap(collection.admin?.components?.edit?.PublishButton)
    addToImportMap(collection.admin?.components?.edit?.SaveButton)
    addToImportMap(collection.admin?.components?.edit?.SaveDraftButton)
    addToImportMap(collection.admin?.components?.edit?.Upload)

    if (collection.admin?.components?.views?.edit) {
      for (const editViewConfig of Object.values(collection.admin?.components?.views?.edit)) {
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

    addToImportMap(collection.admin?.components?.views?.list?.Component)
    addToImportMap(collection.admin?.components?.views?.list?.actions)
  }
}
