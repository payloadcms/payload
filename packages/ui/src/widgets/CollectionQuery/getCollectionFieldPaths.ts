import type { Field, FlattenedField } from 'payload'

import { fieldAffectsData, flattenAllFields, sortableFieldTypes } from 'payload/shared'

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
 * Builds the queryable field paths for a collection by reusing Payload's own field flattening and
 * `sortableFieldTypes`. Keeping the widget's validation anchored on core means it stays correct as
 * field types and sorting rules evolve, instead of duplicating that knowledge.
 */
export function getCollectionFieldPaths(fields: Field[]): CollectionFieldPaths {
  const paths: CollectionFieldPaths = {
    filterableFieldPaths: new Set(baseFieldPaths),
    relationshipFieldPaths: new Set(),
    sortableFieldPaths: new Set(baseFieldPaths),
  }

  addFieldPaths({ fields: flattenAllFields({ fields }), paths })

  return paths
}

function addFieldPaths({
  canSort = true,
  fields,
  parentPath,
  paths,
}: {
  canSort?: boolean
  fields: FlattenedField[]
  parentPath?: string
  paths: CollectionFieldPaths
}) {
  for (const field of fields) {
    if ('virtual' in field && field.virtual === true) {
      continue
    }

    // Groups and named tabs are flattened into queryable columns, so recurse while keeping sort.
    if ((field.type === 'group' || field.type === 'tab') && 'flattenedFields' in field) {
      const path = 'name' in field && field.name ? joinPath(parentPath, field.name) : parentPath

      addFieldPaths({ canSort, fields: field.flattenedFields, parentPath: path, paths })

      continue
    }

    // Array sub-fields can be filtered on, but the API cannot sort by them.
    if (field.type === 'array' && 'flattenedFields' in field) {
      addFieldPaths({
        canSort: false,
        fields: field.flattenedFields,
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
