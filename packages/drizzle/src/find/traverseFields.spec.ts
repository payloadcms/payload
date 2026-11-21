import type { FlattenedField, SelectMode, SelectType } from 'payload'

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../types.js'
import type { Result } from './buildFindManyArgs.js'

import { traverseFields } from './traverseFields.js'

const versionsTable = sqliteTable('_posts_v', {
  id: integer('id').primaryKey(),
  parent: integer('parent_id'),
  version_content: text('version_content'),
  version_title: text('version_title'),
})

const itemsTable = sqliteTable('_posts_v_version_items', {
  id: integer('id').primaryKey(),
  label: text('label'),
  parent: integer('parent_id'),
})

const ctaBlockTable = sqliteTable('_posts_v_blocks_cta', {
  id: integer('id').primaryKey(),
  heading: text('heading'),
})

const adapter = {
  blocksAsJSON: false,
  localesSuffix: '_locales',
  tableNameMap: new Map([
    ['_posts_v', '_posts_v'],
    ['_posts_v_blocks_cta', '_posts_v_blocks_cta'],
    ['_posts_v_version_items', '_posts_v_version_items'],
  ]),
  tables: {
    _posts_v: versionsTable,
    _posts_v_blocks_cta: ctaBlockTable,
    _posts_v_version_items: itemsTable,
  },
} as unknown as DrizzleAdapter

const fields = [
  { name: 'parent', relationTo: 'posts', type: 'relationship' },
  {
    flattenedFields: [
      { name: 'title', type: 'text' },
      {
        flattenedFields: [{ name: 'label', type: 'text' }],
        name: 'items',
        type: 'array',
      },
      {
        blocks: [
          {
            fields: [{ name: 'heading', type: 'text' }],
            flattenedFields: [{ name: 'heading', type: 'text' }],
            slug: 'cta',
          },
        ],
        name: 'content',
        type: 'blocks',
      },
    ],
    name: 'version',
    type: 'group',
  },
] as unknown as FlattenedField[]

const runTraverse = (select?: SelectType, selectMode?: SelectMode): Result => {
  const currentArgs: Result = { columns: {}, extras: {}, with: {} }
  const _locales: Result = { columns: {}, extras: {}, with: {} }

  traverseFields({
    _locales,
    adapter,
    currentArgs,
    currentTableName: '_posts_v',
    depth: 0,
    fields,
    joinQuery: {},
    path: '',
    select,
    selectMode,
    tablePath: '',
    topLevelArgs: currentArgs,
    topLevelTableName: '_posts_v',
    withTabledFields: {},
  })

  return currentArgs
}

describe('traverseFields', () => {
  describe('group/tab select fidelity (https://github.com/payloadcms/payload/issues/18251)', () => {
    it('should not traverse an unselected group in include mode', () => {
      // The admin list view calls findVersions with `select: { parent: true }`.
      // The version group used to be recursed into with `select: undefined`,
      // which every nested branch reads as "select everything" - joining every
      // block/array table of every version and over-fetching (OOM crash-loop).
      const result = runTraverse({ parent: true }, 'include')

      expect(result.columns).toEqual({ parent: true })
      expect(result.with).toEqual({})
    })

    it('should still traverse a group selected with `true` in include mode', () => {
      const result = runTraverse({ version: true }, 'include')

      expect(result.with).toHaveProperty('version_items')
      expect(result.with).toHaveProperty('_blocks_cta')
    })

    it('should still honor a nested object select on a group', () => {
      const result = runTraverse({ version: { items: true } }, 'include')

      expect(result.with).toHaveProperty('version_items')
      expect(result.with).not.toHaveProperty('_blocks_cta')
    })

    it('should still traverse groups in exclude mode when not excluded', () => {
      const result = runTraverse({ title: false }, 'exclude')

      expect(result.with).toHaveProperty('version_items')
      expect(result.with).toHaveProperty('_blocks_cta')
    })

    it('should still traverse groups when no select is provided', () => {
      const result = runTraverse()

      expect(result.with).toHaveProperty('version_items')
      expect(result.with).toHaveProperty('_blocks_cta')
    })
  })
})
