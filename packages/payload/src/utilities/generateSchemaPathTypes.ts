import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { FlattenedBlock, FlattenedField } from '../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'

import { fieldAffectsData } from '../fields/config/types.js'

function collectFieldPaths(
  fields: FlattenedField[],
  parentPath: string,
  pathMap: Map<string, string>,
  config?: SanitizedConfig,
): void {
  for (const field of fields) {
    if (!fieldAffectsData(field)) {
      continue
    }

    const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name
    pathMap.set(fieldPath, field.type)

    if (
      'schemaPathId' in field &&
      typeof (field as any).schemaPathId === 'string' &&
      (field as any).schemaPathId
    ) {
      pathMap.set((field as any).schemaPathId, field.type)
    }

    if ('flattenedFields' in field && field.flattenedFields) {
      collectFieldPaths(field.flattenedFields, fieldPath, pathMap, config)
    }

    if (field.type === 'blocks') {
      const blocks: FlattenedBlock[] = []

      if (field.blockReferences) {
        for (const blockRef of field.blockReferences) {
          if (typeof blockRef === 'string') {
            const resolved = config?.blocks?.find((b) => b.slug === blockRef)
            if (resolved) {
              blocks.push(resolved)
            }
          } else {
            blocks.push(blockRef)
          }
        }
      } else if (field.blocks) {
        for (const block of field.blocks) {
          if (typeof block !== 'string') {
            blocks.push(block)
          }
        }
      }

      for (const block of blocks) {
        const blockPath = `${fieldPath}.${block.slug}`
        pathMap.set(blockPath, 'block')
        if (block.flattenedFields) {
          collectFieldPaths(block.flattenedFields, blockPath, pathMap, config)
        }
      }
    }
  }
}

function collectEntityPaths(
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig,
  pathMap: Map<string, string>,
  config: SanitizedConfig,
): void {
  const prefix = entity.slug
  pathMap.set(prefix, 'entity')
  collectFieldPaths(entity.flattenedFields, prefix, pathMap, config)
}

export function generateSchemaPathType(config: SanitizedConfig): string {
  const pathMap = new Map<string, string>()

  for (const collection of config.collections) {
    collectEntityPaths(collection, pathMap, config)
  }

  for (const global of config.globals) {
    collectEntityPaths(global, pathMap, config)
  }

  if (pathMap.size === 0) {
    return '\nexport interface SchemaPathMap {}\nexport type SchemaPath = never;\n'
  }

  const sortedEntries = [...pathMap.entries()].sort(([a], [b]) => a.localeCompare(b))
  const interfaceMembers = sortedEntries.map(([p, t]) => `  '${p}': '${t}'`).join('\n')

  return `\nexport interface SchemaPathMap {\n${interfaceMembers}\n}\n\nexport type SchemaPath = keyof SchemaPathMap;\n`
}
