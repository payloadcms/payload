import type { SQL } from 'drizzle-orm'

import { and, eq, exists, notExists, or, sql } from 'drizzle-orm'
import { branchChangesCollectionSlug, MAIN_BRANCH } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, GenericTable } from '../types.js'

export const buildBranchVisibility = ({
  adapter,
  branch,
  canonicalIDExpression,
  collectionSlug,
  mode = 'documents',
  table,
}: {
  adapter: DrizzleAdapter
  branch: string
  canonicalIDExpression?: SQL
  collectionSlug: string
  mode?: 'documents' | 'history'
  table: GenericTable
}): SQL => {
  const branchChangesTableName = adapter.tableNameMap.get(toSnakeCase(branchChangesCollectionSlug))
  const branchChangesTable = adapter.tables[branchChangesTableName]
  const canonicalDocumentID =
    canonicalIDExpression ??
    (mode === 'history'
      ? sql`COALESCE(${table['_branchParent']}, ${table['parent']})`
      : sql`COALESCE(${table['_branchDocID']}, ${table['id']})`)
  const documentIDAsText = sql`CAST(${canonicalDocumentID} AS TEXT)`
  const branchChangesTableIdentifier = adapter.schemaName
    ? sql`${sql.identifier(adapter.schemaName)}.${sql.identifier(branchChangesTableName)}`
    : sql.identifier(branchChangesTableName)
  const branchColumn = sql`${branchChangesTableIdentifier}.${sql.identifier(branchChangesTable.branch.name)}`
  const collectionSlugColumn = sql`${branchChangesTableIdentifier}.${sql.identifier(branchChangesTable.collectionSlug.name)}`
  const documentIDColumn = sql`${branchChangesTableIdentifier}.${sql.identifier(branchChangesTable.documentID.name)}`
  const operationColumn = sql`${branchChangesTableIdentifier}.${sql.identifier(branchChangesTable.operation.name)}`
  const baseVersionIDColumn = sql`${branchChangesTableIdentifier}.${sql.identifier(branchChangesTable.baseVersionID.name)}`
  const baseVersionUpdatedAtColumn = sql`${branchChangesTableIdentifier}.${sql.identifier(branchChangesTable.baseVersionUpdatedAt.name)}`
  const matchingChange = sql`(
    SELECT 1 FROM ${branchChangesTableIdentifier}
    WHERE ${branchColumn} = ${branch}
      AND ${collectionSlugColumn} = ${collectionSlug}
      AND ${documentIDColumn} = ${documentIDAsText}
  )`
  const matchingDelete = sql`(
    SELECT 1 FROM ${branchChangesTableIdentifier}
    WHERE ${branchColumn} = ${branch}
      AND ${collectionSlugColumn} = ${collectionSlug}
      AND ${documentIDColumn} = ${documentIDAsText}
      AND ${operationColumn} = ${'delete'}
  )`
  const matchingHistory = sql`(
    SELECT 1 FROM ${branchChangesTableIdentifier}
    WHERE ${branchColumn} = ${branch}
      AND ${collectionSlugColumn} = ${collectionSlug}
      AND ${documentIDColumn} = ${documentIDAsText}
      AND ${operationColumn} <> ${'create'}
      AND (
        (${baseVersionIDColumn} IS NULL AND ${baseVersionUpdatedAtColumn} IS NULL)
        OR CAST(${table['id']} AS TEXT) = ${baseVersionIDColumn}
        OR ${table['updatedAt']} <= ${baseVersionUpdatedAtColumn}
      )
  )`
  const visibility =
    mode === 'history'
      ? or(
          and(
            eq(table['_branch'], MAIN_BRANCH),
            or(notExists(matchingChange), exists(matchingHistory)),
          ),
          eq(table['_branch'], branch),
        )
      : or(
          and(eq(table['_branch'], MAIN_BRANCH), notExists(matchingChange)),
          and(eq(table['_branch'], branch), notExists(matchingDelete)),
        )

  if (!visibility) {
    throw new Error('Could not build branch visibility query')
  }

  return visibility
}
