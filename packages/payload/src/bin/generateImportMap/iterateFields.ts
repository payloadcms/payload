/* eslint-disable @typescript-eslint/no-unused-expressions */
import type { PayloadComponent, SanitizedConfig } from '../../config/types.js'
import type { Block, Field, Tab } from '../../fields/config/types.js'
import type { AddToImportMap, Imports, InternalImportMap } from './index.js'

function hasKey<T, K extends string>(
  obj: null | T | undefined,
  key: K,
): obj is { [P in K]: PayloadComponent | PayloadComponent[] } & T {
  return obj != null && Object.prototype.hasOwnProperty.call(obj, key)
}

/**
 * Path-valued admin refs (admin.condition / admin.validate) need to land in the runtime
 * importMap so the client-side registry can resolve them. Inline-function refs stay
 * server-side; only string (or `{ path, exportName }`) refs are emitted to the bundler.
 */
function addAdminPathRefToImportMap(addToImportMap: AddToImportMap, ref: unknown): void {
  if (typeof ref === 'string') {
    addToImportMap(ref, { kind: 'client' })
    return
  }
  if (
    ref &&
    typeof ref === 'object' &&
    'path' in ref &&
    typeof (ref as { path: unknown }).path === 'string'
  ) {
    addToImportMap(ref as PayloadComponent, { kind: 'client' })
  }
}

const defaultUIFieldComponentKeys: Array<'Cell' | 'Description' | 'Field' | 'Filter'> = [
  'Cell',
  'Description',
  'Field',
  'Filter',
]
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
        fields: field.blocks.filter((block) => typeof block !== 'string'),
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
    } else if (field.type === 'ui') {
      if (field?.admin?.components) {
        // Render any extra, untyped components
        for (const key in field.admin.components) {
          if (key in defaultUIFieldComponentKeys) {
            continue
          }
          addToImportMap(field.admin.components[key], { kind: 'client' })
        }
      }
    }

    // Path-valued admin.condition / admin.validate refs (Phase 5): emit to the runtime
    // importMap so the client-side registry can resolve them. Inline-function refs are
    // skipped here — they continue to run server-side.
    if (field?.admin && 'condition' in field.admin) {
      addAdminPathRefToImportMap(addToImportMap, (field.admin as { condition?: unknown }).condition)
    }
    if (field?.admin && 'validate' in field.admin) {
      addAdminPathRefToImportMap(addToImportMap, (field.admin as { validate?: unknown }).validate)
    }

    // Field-level components render inside the client form tree, so they need to be
    // bundled into the client artifact (`importMap.client.js`).
    hasKey(field?.admin, 'jsx') && addToImportMap(field.admin.jsx, { kind: 'client' }) // For Blocks

    hasKey(field?.admin?.components, 'Label') &&
      addToImportMap(field.admin.components.Label, { kind: 'client' })

    hasKey(field?.admin?.components, 'Block') &&
      addToImportMap(field.admin.components.Block, { kind: 'client' })

    hasKey(field?.admin?.components, 'Cell') &&
      addToImportMap(field?.admin?.components?.Cell, { kind: 'client' })

    hasKey(field?.admin?.components, 'Description') &&
      addToImportMap(field?.admin?.components?.Description, { kind: 'client' })

    hasKey(field?.admin?.components, 'Field') &&
      addToImportMap(field?.admin?.components?.Field, { kind: 'client' })
    hasKey(field?.admin?.components, 'Filter') &&
      addToImportMap(field?.admin?.components?.Filter, { kind: 'client' })

    hasKey(field?.admin?.components, 'Error') &&
      addToImportMap(field?.admin?.components?.Error, { kind: 'client' })

    hasKey(field?.admin?.components, 'afterInput') &&
      addToImportMap(field?.admin?.components?.afterInput, { kind: 'client' })

    hasKey(field?.admin?.components, 'beforeInput') &&
      addToImportMap(field?.admin?.components?.beforeInput, { kind: 'client' })

    hasKey(field?.admin?.components, 'RowLabel') &&
      addToImportMap(field?.admin?.components?.RowLabel, { kind: 'client' })

    hasKey(field?.admin?.components, 'Diff') &&
      addToImportMap(field?.admin?.components?.Diff, { kind: 'client' })
  }
}
