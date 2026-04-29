import type { Field, Tab } from '../fields/config/types.js'
import type { SanitizedConfig } from './types.js'

/**
 * Visitor invoked once per field discovered during a schema walk.
 *
 * `fieldPath` is the joined dot-form path including any wildcard (`*`)
 * segments introduced by arrays/blocks. `fieldPathSegments` is the same
 * value pre-join, exposed for consumers that need raw segment access.
 */
export type WalkSchemaVisitor = (args: {
  field: Field
  fieldPath: string
  fieldPathSegments: string[]
}) => void

/**
 * Walks the field schema for every collection and global on a sanitized
 * config and invokes `visit` once per field encountered. Recurses into
 * `group`, `array`, `blocks`, `tabs`, `row`, and `collapsible` containers
 * with the same path semantics as the historical inline walkers in
 * `buildComponentIndex.ts` and `buildImportMaps.ts`:
 *
 * - `group`: appends the group's name to the path before recursing.
 * - `array` / `blocks`: appends a `*` wildcard before recursing.
 * - `tabs`: named tabs append the tab name; unnamed tabs reuse the parent.
 * - `row` / `collapsible`: traverse without contributing a path segment.
 */
export function walkSchema(config: SanitizedConfig, visit: WalkSchemaVisitor): void {
  for (const collection of config.collections ?? []) {
    walkFields({
      fields: collection.fields ?? [],
      pathSegments: [collection.slug],
      visit,
    })
  }

  for (const global of config.globals ?? []) {
    walkFields({
      fields: global.fields ?? [],
      pathSegments: [global.slug],
      visit,
    })
  }
}

function walkFields({
  fields,
  pathSegments,
  visit,
}: {
  fields: Field[]
  pathSegments: string[]
  visit: WalkSchemaVisitor
}): void {
  for (const field of fields) {
    const fieldPathSegments = computeFieldPathSegments(field, pathSegments)
    const fieldPath = fieldPathSegments.join('.')

    visit({ field, fieldPath, fieldPathSegments })

    switch (field.type) {
      case 'array': {
        walkFields({
          fields: field.fields ?? [],
          pathSegments: [...fieldPathSegments, '*'],
          visit,
        })
        break
      }
      case 'blocks': {
        const blocks = (field.blocks ?? []).filter(
          (block): block is Exclude<typeof block, string> => typeof block !== 'string',
        )
        for (const block of blocks) {
          walkFields({
            fields: block.fields ?? [],
            pathSegments: [...fieldPathSegments, '*'],
            visit,
          })
        }
        break
      }
      case 'collapsible':
      case 'row': {
        walkFields({ fields: field.fields ?? [], pathSegments, visit })
        break
      }
      case 'group': {
        walkFields({ fields: field.fields ?? [], pathSegments: fieldPathSegments, visit })
        break
      }
      case 'tabs': {
        for (const tab of field.tabs ?? []) {
          const tabSegments = isNamedTab(tab) ? [...pathSegments, tab.name] : pathSegments
          walkFields({ fields: tab.fields ?? [], pathSegments: tabSegments, visit })
        }
        break
      }
      default:
        break
    }
  }
}

function computeFieldPathSegments(field: Field, parentSegments: string[]): string[] {
  if ('name' in field && typeof field.name === 'string' && field.name.length > 0) {
    return [...parentSegments, field.name]
  }
  return parentSegments
}

function isNamedTab(tab: Tab): tab is Extract<Tab, { name: string }> {
  return typeof (tab as { name?: unknown }).name === 'string'
}
