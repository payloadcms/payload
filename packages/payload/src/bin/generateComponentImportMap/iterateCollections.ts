import type { SanitizedCollectionConfig } from '../../collections/config/types.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { AddToComponentImportMap, ComponentMap, ImportMap } from './index.js'

import { genComponentImportMapIterateFields } from './iterateFields.js'

export function iterateCollections({
  addToComponentImportMap,
  baseDir,
  collections,
  componentMap,
  config,
  importMap,
}: {
  addToComponentImportMap: AddToComponentImportMap
  baseDir: string
  collections: SanitizedCollectionConfig[]
  componentMap: ComponentMap
  config: SanitizedConfig
  importMap: ImportMap
}) {
  for (const collection of collections) {
    genComponentImportMapIterateFields({
      addToComponentImportMap,
      baseDir,
      componentMap,
      config,
      fields: collection.fields,
      importMap,
    })

    addToComponentImportMap(collection.admin?.components?.afterList)
    addToComponentImportMap(collection.admin?.components?.afterListTable)
    addToComponentImportMap(collection.admin?.components?.beforeList)
    addToComponentImportMap(collection.admin?.components?.beforeListTable)

    addToComponentImportMap(collection.admin?.components?.edit?.Description)
    addToComponentImportMap(collection.admin?.components?.edit?.PreviewButton)
    addToComponentImportMap(collection.admin?.components?.edit?.PublishButton)
    addToComponentImportMap(collection.admin?.components?.edit?.SaveButton)
    addToComponentImportMap(collection.admin?.components?.edit?.SaveDraftButton)
    addToComponentImportMap(collection.admin?.components?.edit?.Upload)

    if (collection.admin?.components?.views?.Edit) {
      for (const editViewConfig of Object.values(collection.admin?.components?.views?.Edit)) {
        if ('Component' in editViewConfig) {
          addToComponentImportMap(editViewConfig?.Component)
        }
      }
    }

    addToComponentImportMap(collection.admin?.components?.views?.List?.Component)
    addToComponentImportMap(collection.admin?.components?.views?.List?.actions)
  }
}
