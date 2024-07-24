import type { PayloadComponent, SanitizedConfig } from '../../config/types.js'
import type { Field } from '../../fields/config/types.js'
import type { AddToComponentImportMap, ComponentMap, ImportMap } from './index.js'

import { fieldHasSubFields } from '../../fields/config/types.js'

function hasKey<T, K extends string>(
  obj: T | null | undefined,
  key: K,
): obj is { [P in K]: PayloadComponent | PayloadComponent[] } & T {
  return obj != null && Object.prototype.hasOwnProperty.call(obj, key)
}

export function genComponentImportMapIterateFields({
  addToComponentImportMap,
  baseDir,
  componentMap,
  config,
  fields,
  importMap,
}: {
  addToComponentImportMap: AddToComponentImportMap
  baseDir: string
  componentMap: ComponentMap
  config: SanitizedConfig
  fields: Field[]
  importMap: ImportMap
}) {
  for (const field of fields) {
    if (fieldHasSubFields(field)) {
      genComponentImportMapIterateFields({
        addToComponentImportMap,
        baseDir,
        componentMap,
        config,
        fields: field.fields,
        importMap,
      })
    } else if (field.type === 'blocks') {
      for (const block of field.blocks) {
        genComponentImportMapIterateFields({
          addToComponentImportMap,
          baseDir,
          componentMap,
          config,
          fields: block.fields,
          importMap,
        })
      }
    } else if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        genComponentImportMapIterateFields({
          addToComponentImportMap,
          baseDir,
          componentMap,
          config,
          fields: tab.fields,
          importMap,
        })
      }
    } else if (field.type === 'richText') {
      if (
        field?.editor &&
        typeof field.editor === 'object' &&
        field.editor.generateComponentImportMap &&
        typeof field.editor.generateComponentImportMap === 'function'
      ) {
        field.editor.generateComponentImportMap({
          addToComponentImportMap,
          baseDir,
          componentMap,
          config,
          importMap,
        })
      }
    }

    hasKey(field?.admin?.components, 'Label') &&
      addToComponentImportMap(field.admin.components.Label)

    addToComponentImportMap(field?.admin?.components?.Cell)

    hasKey(field?.admin?.components, 'Description') &&
      addToComponentImportMap(field?.admin?.components?.Description)

    addToComponentImportMap(field?.admin?.components?.Field)
    addToComponentImportMap(field?.admin?.components?.Filter)

    hasKey(field?.admin?.components, 'Error') &&
      addToComponentImportMap(field?.admin?.components?.Error)

    hasKey(field?.admin?.components, 'afterInput') &&
      addToComponentImportMap(field?.admin?.components?.afterInput)

    hasKey(field?.admin?.components, 'beforeInput') &&
      addToComponentImportMap(field?.admin?.components?.beforeInput)

    hasKey(field?.admin?.components, 'RowLabel') &&
      addToComponentImportMap(field?.admin?.components?.RowLabel)
  }
}
