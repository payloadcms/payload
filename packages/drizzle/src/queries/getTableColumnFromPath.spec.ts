import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'

import { getTableColumnFromPath } from './getTableColumnFromPath.js'

const pages = pgTable('pages', {
  id: serial('id').primaryKey(),
})

const pagesBlocksTextA = pgTable('pages_blocks_text_a', {
  _parentID: integer('_parent_id'),
  id: serial('id').primaryKey(),
})

const pagesBlocksTextB = pgTable('pages_blocks_text_b', {
  _parentID: integer('_parent_id'),
  id: serial('id').primaryKey(),
})

const pagesBlocksDocumentList = pgTable('pages_blocks_document_list', {
  _parentID: integer('_parent_id'),
  id: serial('id').primaryKey(),
})

const pagesRels = pgTable('pages_rels', {
  documentsID: integer('documents_id'),
  id: serial('id').primaryKey(),
  parent: integer('parent'),
  path: text('path'),
})

const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  title: text('title'),
})

const adapter = {
  idType: 'serial',
  name: 'postgres',
  payload: {
    blocks: {},
    collections: {
      documents: {
        config: {
          flattenedFields: [],
          slug: 'documents',
        },
      },
    },
    config: {},
  },
  relationshipsSuffix: '_rels',
  tableNameMap: new Map([
    ['documents', 'documents'],
    ['pages_blocks_document_list', 'pages_blocks_document_list'],
    ['pages_blocks_text_a', 'pages_blocks_text_a'],
    ['pages_blocks_text_b', 'pages_blocks_text_b'],
  ]),
  tables: {
    documents,
    pages,
    pages_blocks_document_list: pagesBlocksDocumentList,
    pages_blocks_text_a: pagesBlocksTextA,
    pages_blocks_text_b: pagesBlocksTextB,
    pages_rels: pagesRels,
  },
} as never

// Mirrors issue #18272: three blocks, the hasMany relationship lives in the LAST one.
const fields = [
  {
    blocks: [
      { flattenedFields: [{ name: 'text', type: 'text' }], slug: 'textA' },
      { flattenedFields: [{ name: 'text', type: 'text' }], slug: 'textB' },
      {
        flattenedFields: [
          { hasMany: true, name: 'documents', relationTo: 'documents', type: 'relationship' },
        ],
        slug: 'documentList',
      },
    ],
    name: 'layout',
    type: 'blocks',
  },
] as never

const buildPath = () => {
  const joins: { queryPath?: string }[] = []
  getTableColumnFromPath({
    adapter,
    collectionPath: 'pages',
    fields,
    joins: joins as never,
    parentIsLocalized: false,
    pathSegments: ['layout', 'documents'],
    selectFields: {},
    tableName: 'pages',
    value: '1',
  })
  return joins.map((join) => join.queryPath).filter(Boolean) as string[]
}

describe('getTableColumnFromPath blocks constraintPath', () => {
  it('builds a single block path segment when the relationship is not in the first block', () => {
    const queryPaths = buildPath()

    // The relationship branch records joins with `${constraintPath}.${field.name}`;
    // constraintPath itself must hold exactly one `layout.%.` segment.
    expect(queryPaths).toContain('layout.%..documents')
    expect(queryPaths.filter((queryPath) => queryPath.includes('layout.%.layout.%'))).toEqual([])
  })
})
