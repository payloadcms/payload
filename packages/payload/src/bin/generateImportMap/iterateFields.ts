import type { PayloadComponent, SanitizedConfig } from '../../config/types.js'
import type { Block, Field, Tab } from '../../fields/config/types.js'
import type { AddToImportMap, Imports, InternalImportMap } from './index.js'

function hasKey<T, K extends string>(
  obj: null | T | undefined,
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
  fields: Block[] | Field[] | Tab[]
  importMap: InternalImportMap
  imports: Imports
}) {
  for (const field of fields) {
    if ('fields' in field) {
      genImportMapIterateFields({
        addToImportMap,
        baseDir,
        config,
        fields: field.fields,
        importMap,
        imports,
      })
    } else if (field.type === 'blocks') {
      genImportMapIterateFields({
        addToImportMap,
        baseDir,
        config,
        fields: field.blocks,
        importMap,
        imports,
      })
    } else if (field.type === 'tabs') {
      genImportMapIterateFields({
        addToImportMap,
        baseDir,
        config,
        fields: field.tabs,
        importMap,
        imports,
      })
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

    if ('admin' in field && 'components' in field.admin) {
      if (hasKey(field?.admin?.components, 'Label')) {
        addToImportMap(field.admin.components.Label)
      }

      if (hasKey(field?.admin?.components, 'Cell')) {
        addToImportMap(field?.admin?.components?.Cell)
      }

      if (hasKey(field?.admin?.components, 'Description')) {
        addToImportMap(field?.admin?.components?.Description)
      }

      if (hasKey(field?.admin?.components, 'Field')) {
        addToImportMap(field?.admin?.components?.Field)
      }
      if (hasKey(field?.admin?.components, 'Filter')) {
        addToImportMap(field?.admin?.components?.Filter)
      }

      if (hasKey(field?.admin?.components, 'Error')) {
        addToImportMap(field?.admin?.components?.Error)
      }

      if (hasKey(field?.admin?.components, 'afterInput')) {
        addToImportMap(field?.admin?.components?.afterInput)
      }

      if (hasKey(field?.admin?.components, 'beforeInput')) {
        addToImportMap(field?.admin?.components?.beforeInput)
      }

      if (hasKey(field?.admin?.components, 'RowLabel')) {
        addToImportMap(field?.admin?.components?.RowLabel)
      }
    }
  }
}
