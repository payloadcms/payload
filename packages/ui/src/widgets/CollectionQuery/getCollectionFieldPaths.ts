import type { ClientField, Field } from 'payload'

import { fieldAffectsData, sortableFieldTypes } from 'payload/shared'

type QueryableField = ClientField | Field

const baseFieldPaths = ['createdAt', 'id', 'updatedAt']
const sortableFieldTypeSet = new Set<string>(sortableFieldTypes)
const relationshipFieldTypes = new Set<string>(['join', 'relationship', 'upload'])

export type CollectionFieldPaths = {
  /** Field paths that can be referenced in a `where` filter. */
  filterableFieldPaths: Set<string>
  /** Field paths that point to another collection (relationship/upload/join). */
  relationshipFieldPaths: Set<string>
  /** Field paths that the API can sort by. */
  sortableFieldPaths: Set<string>
}

/**
 * Builds the queryable field paths for a collection from either server or client field schemas.
 * Sortability stays anchored on Payload's `sortableFieldTypes` so the widget follows core rules as
 * field types evolve, while array sub-fields remain filter-only.
 */
export function getCollectionFieldPaths(fields: QueryableField[]): CollectionFieldPaths {
  const paths: CollectionFieldPaths = {
    filterableFieldPaths: new Set(baseFieldPaths),
    relationshipFieldPaths: new Set(),
    sortableFieldPaths: new Set(baseFieldPaths),
  }

  addFieldPaths({ fields, paths })

  return paths
}

function addFieldPaths({
  canSort = true,
  fields,
  parentPath,
  paths,
}: {
  canSort?: boolean
  fields: QueryableField[]
  parentPath?: string
  paths: CollectionFieldPaths
}) {
  for (const field of fields) {
    if ('virtual' in field && field.virtual === true) {
      continue
    }

    if (field.type === 'tabs' && 'tabs' in field) {
      for (const tab of field.tabs) {
        const path = 'name' in tab && tab.name ? joinPath(parentPath, tab.name) : parentPath

        addFieldPaths({ canSort, fields: tab.fields, parentPath: path, paths })
      }

      continue
    }

    if ((field.type === 'collapsible' || field.type === 'row') && 'fields' in field) {
      addFieldPaths({ canSort, fields: field.fields, parentPath, paths })

      continue
    }

    // Groups are queryable by their child paths. Named groups prefix those paths.
    if (field.type === 'group' && 'fields' in field) {
      const path = fieldAffectsData(field) ? joinPath(parentPath, field.name) : parentPath

      addFieldPaths({ canSort, fields: field.fields, parentPath: path, paths })

      continue
    }

    // Array sub-fields can be filtered on, but the API cannot sort by them.
    if (field.type === 'array' && 'fields' in field) {
      addFieldPaths({
        canSort: false,
        fields: field.fields,
        parentPath: joinPath(parentPath, field.name),
        paths,
      })

      continue
    }

    if (field.type === 'blocks' || !fieldAffectsData(field)) {
      continue
    }

    const name =
      'virtual' in field && typeof field.virtual === 'string' ? field.virtual : field.name
    const path = joinPath(parentPath, name)

    paths.filterableFieldPaths.add(path)

    if (relationshipFieldTypes.has(field.type)) {
      paths.relationshipFieldPaths.add(path)
    }

    if (canSort && sortableFieldTypeSet.has(field.type)) {
      paths.sortableFieldPaths.add(path)
    }
  }
}

function joinPath(parentPath: string | undefined, path: string) {
  return parentPath ? `${parentPath}.${path}` : path
}
