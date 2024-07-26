import type { PayloadComponent, SanitizedConfig } from '../../config/types.js'
import type { Field } from '../../fields/config/types.js'
import type { AddToImportMap, Imports, InternalImportMap } from './index.js'

import { fieldHasSubFields } from '../../fields/config/types.js'

function hasKey<T, K extends string>(
  obj: T | null | undefined,
  key: K,
): obj is { [P in K]: PayloadComponent | PayloadComponent[] } & T {
  return obj != null && Object.prototype.hasOwnProperty.call(obj, key)
}

export function genImportMapIterateFields({
  addToImportMap,
  baseDir,
  config,
  fields,
  importMap,
  imports,
}: {
  addToImportMap: AddToImportMap
  baseDir: string
  config: SanitizedConfig
  fields: Field[]
  importMap: InternalImportMap
  imports: Imports
}) {
  for (const field of fields) {
    if (fieldHasSubFields(field)) {
      genImportMapIterateFields({
        addToImportMap,
        baseDir,
        config,
        fields: field.fields,
        importMap,
        imports,
      })
    } else if (field.type === 'blocks') {
      for (const block of field.blocks) {
        genImportMapIterateFields({
          addToImportMap,
          baseDir,
          config,
          fields: block.fields,
          importMap,
          imports,
        })
      }
    } else if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        genImportMapIterateFields({
          addToImportMap,
          baseDir,
          config,
          fields: tab.fields,
          importMap,
          imports,
        })
      }
    } else if (field.type === 'richText') {
      if (
        field?.editor &&
        typeof field.editor === 'object' &&
        field.editor.generateImportMap &&
        typeof field.editor.generateImportMap === 'function'
      ) {
        field.editor.generateImportMap({
          addToImportMap,
          baseDir,
          config,
          importMap,
          imports,
        })
      }
    }

    hasKey(field?.admin?.components, 'Label') && addToImportMap(field.admin.components.Label)

    addToImportMap(field?.admin?.components?.Cell)

    hasKey(field?.admin?.components, 'Description') &&
      addToImportMap(field?.admin?.components?.Description)

    addToImportMap(field?.admin?.components?.Field)
    addToImportMap(field?.admin?.components?.Filter)

    hasKey(field?.admin?.components, 'Error') && addToImportMap(field?.admin?.components?.Error)

    hasKey(field?.admin?.components, 'afterInput') &&
      addToImportMap(field?.admin?.components?.afterInput)

    hasKey(field?.admin?.components, 'beforeInput') &&
      addToImportMap(field?.admin?.components?.beforeInput)

    hasKey(field?.admin?.components, 'RowLabel') &&
      addToImportMap(field?.admin?.components?.RowLabel)
  }
}
