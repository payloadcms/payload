import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { FlattenedBlock, FlattenedField } from '../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'

import { fieldAffectsData } from '../fields/config/types.js'

function collectFieldPaths(
  fields: FlattenedField[],
  parentPath: string,
  paths: Set<string>,
  config?: SanitizedConfig,
): void {
  for (const field of fields) {
    if (!fieldAffectsData(field)) {
      continue
    }

    const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name
    paths.add(fieldPath)

    if (
      'schemaPathId' in field &&
      typeof (field as any).schemaPathId === 'string' &&
      (field as any).schemaPathId
    ) {
      paths.add((field as any).schemaPathId)
    }

    if ('flattenedFields' in field && field.flattenedFields) {
      collectFieldPaths(field.flattenedFields, fieldPath, paths, config)
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
        paths.add(blockPath)
        if (block.flattenedFields) {
          collectFieldPaths(block.flattenedFields, blockPath, paths, config)
        }
      }
    }
  }
}

function collectEntityPaths(
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig,
  paths: Set<string>,
  config: SanitizedConfig,
): void {
  const prefix = entity.slug
  paths.add(prefix)
  collectFieldPaths(entity.flattenedFields, prefix, paths, config)
}

export function generateSchemaPathType(config: SanitizedConfig): string {
  const paths = new Set<string>()

  for (const collection of config.collections) {
    collectEntityPaths(collection, paths, config)
  }

  for (const global of config.globals) {
    collectEntityPaths(global, paths, config)
  }

  if (paths.size === 0) {
    return '\nexport type SchemaPath = never;\n'
  }

  const sortedPaths = [...paths].sort()
  const unionMembers = sortedPaths.map((p) => `  | '${p}'`).join('\n')

  return `\nexport type SchemaPath =\n${unionMembers};\n`
}
