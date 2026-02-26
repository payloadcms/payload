import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { Field, FlattenedBlock, FlattenedField } from '../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'

function collectFieldPaths(
  fields: FlattenedField[],
  parentPath: string,
  pathMap: Map<string, string>,
  config?: SanitizedConfig,
): void {
  for (const field of fields) {
    if (!('name' in field) || !field.name) {
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

function collectRawFieldPaths(
  fields: Field[],
  parentPath: string,
  pathMap: Map<string, string>,
): void {
  for (const field of fields) {
    if (field.type === 'ui' && 'name' in field && field.name) {
      const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name
      pathMap.set(fieldPath, 'ui')
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const subParent =
        'name' in field && field.name
          ? parentPath
            ? `${parentPath}.${field.name}`
            : field.name
          : parentPath
      collectRawFieldPaths(field.fields, subParent, pathMap)
    }

    if ('tabs' in field && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        const tabParent =
          'name' in tab && tab.name
            ? parentPath
              ? `${parentPath}.${tab.name}`
              : tab.name
            : parentPath
        collectRawFieldPaths(tab.fields, tabParent, pathMap)
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
  collectRawFieldPaths(entity.fields, prefix, pathMap)
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
