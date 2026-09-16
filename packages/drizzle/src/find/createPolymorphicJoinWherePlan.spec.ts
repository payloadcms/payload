import type { Field, FlattenedField, Where } from 'payload'

import { getTableName } from 'drizzle-orm'
import { pgEnum, pgTable, serial } from 'drizzle-orm/pg-core'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { flattenAllFields } from 'payload'
import toSnakeCase from 'to-snake-case'
import { describe, expect, it } from 'vitest'

import type { DrizzleAdapter, GenericTable } from '../types.js'

import { createPolymorphicJoinWherePlan } from './createPolymorphicJoinWherePlan.js'

type CollectionFixture = {
  fields: Field[]
  table: GenericTable
}

/** Child tables a localized or separate-row path is correlated through. */
const articlesLocalesTable = sqliteTable('join_articles_locales', {
  id: integer('id').primaryKey(),
  _locale: text('_locale'),
  _parentID: integer('_parent_id'),
  localizedTitle: text('localized_title'),
})

const articlesEntriesTable = sqliteTable('join_articles_entries', {
  id: integer('id').primaryKey(),
  _parentID: integer('_parent_id'),
  label: text('label'),
})

const articlesEntriesTagsTable = sqliteTable('join_articles_entries_tags', {
  id: integer('id').primaryKey(),
  parent: integer('parent_id'),
  value: text('value'),
})

const articlesBlocksHeroTable = sqliteTable('join_articles_blocks_hero', {
  id: integer('id').primaryKey(),
  _parentID: integer('_parent_id'),
  _path: text('_path'),
})

const articlesBlocksHeroTagsTable = sqliteTable('join_articles_blocks_hero_tags', {
  id: integer('id').primaryKey(),
  parent: integer('parent_id'),
  value: text('value'),
})

const articlesTable = sqliteTable('join_articles', {
  id: integer('id').primaryKey(),
  config: text('config'),
  details_status: text('details_status_flat'),
  extras: text('extras'),
  meta_settings: text('meta_settings'),
  settings: text('settings'),
  score: integer('score'),
  status: text('status'),
  variantKind: text('variant_kind'),
  variantRadio: text('variant_radio'),
  variantRadioMismatch: text('variant_radio_mismatch'),
  title: text('title'),
  variantSelect: text('variant_select'),
  variantSelectMismatch: text('variant_select_mismatch'),
  variantValue: text('variant_value'),
})

const notesTable = sqliteTable('join_notes', {
  id: integer('id').primaryKey(),
  config_mode: text('config_mode'),
  details_status: text('details_status_flat'),
  settings: text('settings'),
  status: text('status'),
  variantKind: text('variant_kind'),
  variantRadio: integer('variant_radio'),
  variantRadioMismatch: integer('variant_radio_mismatch'),
  title: text('title'),
  variantSelect: integer('variant_select'),
  variantSelectMismatch: integer('variant_select_mismatch'),
  variantTags: text('variant_tags'),
  variantValue: integer('variant_value'),
})

const articleSelectEnum = pgEnum('join_plan_article_select', ['available', 'reviewed'])
const articleRadioEnum = pgEnum('join_plan_article_radio', ['draft', 'published'])
const noteSelectEnum = pgEnum('join_plan_note_select', ['available', 'reviewed'])
const noteRadioEnum = pgEnum('join_plan_note_radio', ['draft', 'published'])

const postgresArticlesTable = pgTable('join_plan_articles', {
  id: serial('id').primaryKey(),
  variantRadio: articleRadioEnum('variant_radio'),
  variantSelect: articleSelectEnum('variant_select'),
})

const postgresNotesTable = pgTable('join_plan_notes', {
  id: serial('id').primaryKey(),
  variantRadio: noteRadioEnum('variant_radio'),
  variantSelect: noteSelectEnum('variant_select'),
})

const articleFields: Field[] = [
  { name: 'title', type: 'text' },
  { name: 'score', type: 'number' },
  {
    name: 'details',
    type: 'group',
    fields: [
      { name: 'status', type: 'text' },
      { hasMany: true, name: 'tags', options: ['available'], type: 'select' },
    ],
  },
  { name: 'details_status', type: 'text' },
  { name: 'status', type: 'text' },
  { hasMany: true, name: 'variantTags', options: ['available'], type: 'select' },
  { name: 'variantKind', options: ['available'], type: 'select' },
  {
    name: 'variantRadio',
    options: [{ label: 'Available', value: 'available' }, 'reviewed'],
    type: 'radio',
  },
  { name: 'variantRadioMismatch', options: ['available', 'reviewed'], type: 'radio' },
  { name: 'variantSelect', options: ['available', 'reviewed'], type: 'select' },
  { name: 'variantSelectMismatch', options: ['available', 'reviewed'], type: 'select' },
  { name: 'variantValue', type: 'text' },
  { name: 'settings', type: 'json' },
  { name: 'extras', type: 'json' },
  { name: 'config', type: 'json' },
  { name: 'meta', type: 'group', fields: [{ name: 'settings', type: 'json' }] },
  { localized: true, name: 'localizedSettings', type: 'json' },
  { localized: true, name: 'localizedTitle', type: 'text' },
  {
    name: 'entries',
    type: 'array',
    fields: [
      { name: 'label', type: 'text' },
      { hasMany: true, name: 'tags', options: ['available'], type: 'select' },
    ],
  },
  {
    name: 'content',
    type: 'blocks',
    blocks: [
      {
        slug: 'hero',
        fields: [{ hasMany: true, name: 'tags', options: ['available'], type: 'select' }],
      },
    ],
  },
]

const noteFields: Field[] = [
  { name: 'title', type: 'text' },
  {
    name: 'details',
    type: 'group',
    fields: [
      { name: 'status', type: 'text' },
      { hasMany: true, name: 'tags', options: ['available'], type: 'select' },
    ],
  },
  { name: 'details_status', type: 'text' },
  { name: 'status', type: 'text' },
  { name: 'variantTags', options: ['available'], type: 'select' },
  { name: 'variantKind', options: ['available'], type: 'radio' },
  {
    name: 'variantRadio',
    options: [{ label: 'Different label', value: 'available' }, 'reviewed'],
    type: 'radio',
  },
  { name: 'variantRadioMismatch', options: ['reviewed', 'available'], type: 'radio' },
  { name: 'variantSelect', options: ['available', 'reviewed'], type: 'select' },
  { name: 'variantSelectMismatch', options: ['reviewed', 'available'], type: 'select' },
  { name: 'variantValue', type: 'number' },
  { name: 'settings', type: 'json' },
  { name: 'config', type: 'group', fields: [{ name: 'mode', type: 'text' }] },
]

const articleEnumFields: Field[] = [
  {
    name: 'variantSelect',
    options: ['available', { label: 'Reviewed', value: 'reviewed' }],
    type: 'select',
  },
  { name: 'variantRadio', options: ['draft', 'published'], type: 'radio' },
]

const noteEnumFields: Field[] = [
  {
    name: 'variantSelect',
    options: [{ label: 'Available', value: 'available' }, 'reviewed'],
    type: 'select',
  },
  {
    name: 'variantRadio',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Published', value: 'published' },
    ],
    type: 'radio',
  },
]

const createAdapter = (
  fixtures: Record<string, CollectionFixture>,
  childTables: GenericTable[] = [],
): DrizzleAdapter => {
  const collections: Record<
    string,
    { config: { fields: Field[]; flattenedFields: FlattenedField[] } }
  > = {}
  const tableNameMap = new Map<string, string>()
  const tables: Record<string, GenericTable | undefined> = {}

  for (const [slug, fixture] of Object.entries(fixtures)) {
    const tableName = getTableName(fixture.table)

    collections[slug] = {
      config: {
        fields: fixture.fields,
        flattenedFields: flattenAllFields({ fields: fixture.fields }),
      },
    }
    tableNameMap.set(toSnakeCase(slug), tableName)
    tables[tableName] = fixture.table
  }

  for (const childTable of childTables) {
    const childTableName = getTableName(childTable)

    tableNameMap.set(childTableName, childTableName)
    tables[childTableName] = childTable
  }

  return {
    idType: 'serial',
    localesSuffix: '_locales',
    payload: { collections },
    tableNameMap,
    tables,
  } as unknown as DrizzleAdapter
}

const adapter = createAdapter(
  {
    articles: { fields: articleFields, table: articlesTable },
    notes: { fields: noteFields, table: notesTable },
  },
  [
    articlesLocalesTable,
    articlesEntriesTable,
    articlesEntriesTagsTable,
    articlesBlocksHeroTable,
    articlesBlocksHeroTagsTable,
  ],
)

const createPlan = (where: Where, collections = ['articles', 'notes']) =>
  createPolymorphicJoinWherePlan({ adapter, collections, where })

describe('createPolymorphicJoinWherePlan', () => {
  it('creates one scalar plan per unique field in nested boolean clauses', () => {
    const plan = createPlan({
      AND: [
        { title: { equals: 'available' } },
        { 'details.status': { equals: 'reviewed' } },
        { OR: [{ score: { greater_than: 1 } }, { title: { not_equals: 'restricted' } }] },
      ],
    })

    expect([...plan.keys()]).toEqual(['title', 'details.status', 'score'])
    expect(plan.get('title')).toMatchObject({
      columnPath: 'title',
      schemaPath: 'title',
      type: 'scalar',
    })
    expect([...plan.get('title').fieldsByCollection.keys()]).toEqual(['articles', 'notes'])
    expect(plan.get('details.status')).toMatchObject({
      columnPath: 'details_status',
      type: 'scalar',
    })
    expect([...plan.get('score').fieldsByCollection.keys()]).toEqual(['articles'])
  })

  it('creates scalar plans for id and relationTo without configured fields', () => {
    const plan = createPlan({
      id: { in: [1, 2] },
      relationTo: { equals: 'articles' },
    })

    expect(plan.get('id')).toMatchObject({ columnPath: 'id', type: 'scalar' })
    expect([...plan.get('id').fieldsByCollection.keys()]).toEqual(['articles', 'notes'])
    expect(plan.get('relationTo')).toMatchObject({ columnPath: 'relationTo', type: 'scalar' })
    expect(plan.get('relationTo').fieldsByCollection.size).toBe(0)
  })

  it('uses a synthetic UUID field context for an id path without a configured id field', () => {
    const uuidTable = sqliteTable('uuid_articles', {
      id: text('id').primaryKey(),
    })
    const uuidAdapter = createAdapter({ articles: { fields: [], table: uuidTable } })

    uuidAdapter.idType = 'uuid'

    const idPlan = createPolymorphicJoinWherePlan({
      adapter: uuidAdapter,
      collections: ['articles'],
      where: { id: { equals: '01991f04-1780-7000-8000-000000000001' } },
    }).get('id')

    expect(idPlan.fieldsByCollection.get('articles')).toMatchObject({
      field: { name: 'id', type: 'text' },
      isUUID: true,
      type: 'scalar',
    })
  })

  it('keeps a scalar path valid when it is absent from one target collection', () => {
    const scorePlan = createPlan({ score: { equals: 5 } }).get('score')

    expect(scorePlan.type).toBe('scalar')
    expect([...scorePlan.fieldsByCollection.keys()]).toEqual(['articles'])
  })

  it('creates a hasManySelect plan when the field uses separate value rows', () => {
    const tagsPlan = createPlan({ 'details.tags': { contains: 'available' } }).get('details.tags')

    expect(tagsPlan).toMatchObject({
      columnPath: 'details_tags',
      schemaPath: 'details.tags',
      type: 'hasManySelect',
    })
    expect([...tagsPlan.fieldsByCollection.values()]).toEqual([
      expect.objectContaining({
        field: expect.objectContaining({ name: 'tags' }),
        type: 'hasManySelect',
      }),
      expect.objectContaining({
        field: expect.objectContaining({ name: 'tags' }),
        type: 'hasManySelect',
      }),
    ])
  })

  it('accepts matching select fields even when their database column types differ', () => {
    const selectPlan = createPlan({ variantSelect: { equals: 'available' } }).get('variantSelect')

    expect(selectPlan.type).toBe('scalar')
    expect([...selectPlan.fieldsByCollection.keys()]).toEqual(['articles', 'notes'])
  })

  it('accepts text and textarea fields that use the same query value coercion', () => {
    const fieldsWithTextarea = noteFields.map((field) =>
      field.name === 'title' ? { ...field, type: 'textarea' as const } : field,
    )
    const compatibleAdapter = createAdapter({
      articles: { fields: articleFields, table: articlesTable },
      notes: { fields: fieldsWithTextarea, table: notesTable },
    })
    const titlePlan = createPolymorphicJoinWherePlan({
      adapter: compatibleAdapter,
      collections: ['articles', 'notes'],
      where: { title: { equals: 'available' } },
    }).get('title')

    expect(titlePlan.type).toBe('scalar')
  })

  it.each([
    ['select', 'variantSelect', 'available'],
    ['radio', 'variantRadio', 'draft'],
  ] as const)(
    'accepts PostgreSQL %s fields with separate enum types and matching option values',
    (_fieldType, schemaPath, value) => {
      const postgresAdapter = createAdapter({
        articles: { fields: articleEnumFields, table: postgresArticlesTable },
        notes: { fields: noteEnumFields, table: postgresNotesTable },
      })
      const fieldPlan = createPolymorphicJoinWherePlan({
        adapter: postgresAdapter,
        collections: ['articles', 'notes'],
        where: { [schemaPath]: { equals: value } },
      }).get(schemaPath)

      expect(fieldPlan.type).toBe('scalar')
      expect([...fieldPlan.fieldsByCollection.keys()]).toEqual(['articles', 'notes'])
    },
  )

  it.each([
    ['select', 'variantSelect', ['available', 'restricted']],
    ['select', 'variantSelect', ['reviewed', 'available']],
    ['radio', 'variantRadio', ['draft', 'restricted']],
    ['radio', 'variantRadio', ['published', 'draft']],
  ] as const)(
    'rejects PostgreSQL %s fields whose option values differ or use a different order',
    (fieldType, schemaPath, options) => {
      const noteFieldsWithDifferentOptions = noteEnumFields.map((field) =>
        field.name === schemaPath ? { ...field, options: [...options], type: fieldType } : field,
      ) as Field[]
      const postgresAdapter = createAdapter({
        articles: { fields: articleEnumFields, table: postgresArticlesTable },
        notes: { fields: noteFieldsWithDifferentOptions, table: postgresNotesTable },
      })
      const fieldPlan = createPolymorphicJoinWherePlan({
        adapter: postgresAdapter,
        collections: ['articles', 'notes'],
        where: { [schemaPath]: { equals: options[0] } },
      }).get(schemaPath)

      expect(fieldPlan.type).toBe('invalid')
    },
  )

  it('accepts matching radio option values even when labels and database column types differ', () => {
    const radioPlan = createPlan({ variantRadio: { equals: 'available' } }).get('variantRadio')

    expect(radioPlan.type).toBe('scalar')
    expect([...radioPlan.fieldsByCollection.keys()]).toEqual(['articles', 'notes'])
  })

  it('accepts a has-many select mixed with a single select that shares option values', () => {
    const variantTagsPlan = createPlan({ variantTags: { equals: 'available' } }).get('variantTags')

    expect(variantTagsPlan.type).toBe('mixedSelect')
    expect(variantTagsPlan.fieldsByCollection.get('articles')?.type).toBe('hasManySelect')
    expect(variantTagsPlan.fieldsByCollection.get('notes')?.type).toBe('scalar')
  })

  it('marks a has-many select mixed with a single select as invalid when option values differ', () => {
    const noteFieldsWithDifferentOptions = noteFields.map((field) =>
      field.name === 'variantTags' ? { ...field, options: ['restricted'] } : field,
    ) as Field[]
    const mismatchedAdapter = createAdapter({
      articles: { fields: articleFields, table: articlesTable },
      notes: { fields: noteFieldsWithDifferentOptions, table: notesTable },
    })

    const variantTagsPlan = createPolymorphicJoinWherePlan({
      adapter: mismatchedAdapter,
      collections: ['articles', 'notes'],
      where: { variantTags: { equals: 'available' } },
    }).get('variantTags')

    expect(variantTagsPlan.type).toBe('invalid')
  })

  it('creates a separateRows plan for a localized field', () => {
    const localizedPlan = createPlan({ localizedTitle: { equals: 'value' } }).get('localizedTitle')

    expect(localizedPlan.type).toBe('separateRows')
    expect(localizedPlan.fieldsByCollection.get('articles')).toMatchObject({
      chain: {
        hops: [
          {
            isLocalesTable: true,
            localeColumnKey: '_locale',
            parentColumnKey: '_parentID',
            tableName: 'join_articles_locales',
          },
        ],
        leafColumnKey: 'localizedTitle',
      },
      type: 'separateRows',
    })
  })

  it('creates a separateRows plan for a has-many select inside an array', () => {
    const arrayPlan = createPlan({ 'entries.tags': { equals: 'value' } }).get('entries.tags')

    expect(arrayPlan.type).toBe('separateRows')
    expect(arrayPlan.fieldsByCollection.get('articles')).toMatchObject({
      chain: {
        hops: [
          {
            isLocalesTable: false,
            parentColumnKey: '_parentID',
            tableName: 'join_articles_entries',
          },
          {
            isLocalesTable: false,
            parentColumnKey: 'parent',
            tableName: 'join_articles_entries_tags',
          },
        ],
        leafColumnKey: 'value',
      },
    })
  })

  it('creates a separateRows plan for a scalar column inside an array', () => {
    const arrayPlan = createPlan({ 'entries.label': { equals: 'value' } }).get('entries.label')

    expect(arrayPlan.type).toBe('separateRows')
    expect(arrayPlan.fieldsByCollection.get('articles')?.chain).toMatchObject({
      hops: [{ tableName: 'join_articles_entries' }],
      leafColumnKey: 'label',
    })
  })

  it('scopes a separateRows plan for block rows by the blocks field path', () => {
    const blockPlan = createPlan({ 'content.hero.tags': { equals: 'value' } }).get(
      'content.hero.tags',
    )

    expect(blockPlan.type).toBe('separateRows')
    expect(blockPlan.fieldsByCollection.get('articles')?.chain).toMatchObject({
      hops: [
        { pathValue: 'content', tableName: 'join_articles_blocks_hero' },
        { tableName: 'join_articles_blocks_hero_tags' },
      ],
      leafColumnKey: 'value',
    })
  })

  it('marks a separateRows path as invalid when a target stores it as a plain column', () => {
    const notesWithPlainTitle = [...noteFields, { name: 'localizedTitle', type: 'text' }] as Field[]
    const mixedAdapter = createAdapter(
      {
        articles: { fields: articleFields, table: articlesTable },
        notes: {
          fields: notesWithPlainTitle,
          table: sqliteTable('join_notes_plain', {
            id: integer('id').primaryKey(),
            localizedTitle: text('localized_title'),
          }),
        },
      },
      [articlesLocalesTable],
    )

    expect(
      createPolymorphicJoinWherePlan({
        adapter: mixedAdapter,
        collections: ['articles', 'notes'],
        where: { localizedTitle: { equals: 'value' } },
      }).get('localizedTitle'),
    ).toMatchObject({ type: 'invalid' })
  })

  it('marks a localized path as invalid when its locales table is not mapped', () => {
    const adapterWithoutLocales = createAdapter({
      articles: { fields: articleFields, table: articlesTable },
    })

    expect(
      createPolymorphicJoinWherePlan({
        adapter: adapterWithoutLocales,
        collections: ['articles'],
        where: { localizedTitle: { equals: 'value' } },
      }).get('localizedTitle'),
    ).toMatchObject({ type: 'invalid' })
  })

  it('creates a jsonPath plan for a sub-path of a json field', () => {
    const settingsPlan = createPlan({ 'settings.approved': { equals: true } }).get(
      'settings.approved',
    )

    expect(settingsPlan).toMatchObject({
      columnPath: 'settings_approved',
      schemaPath: 'settings.approved',
      type: 'jsonPath',
    })
    expect(settingsPlan.fieldsByCollection.get('articles')).toMatchObject({
      jsonColumnPath: 'settings',
      jsonPathSegments: ['approved'],
      type: 'jsonPath',
    })
    expect(settingsPlan.fieldsByCollection.get('notes')).toMatchObject({
      jsonColumnPath: 'settings',
      jsonPathSegments: ['approved'],
      type: 'jsonPath',
    })
  })

  it('resolves a json sub-path whose key matches another field name', () => {
    const settingsPlan = createPlan({ 'settings.variantTags': { equals: 'available' } }).get(
      'settings.variantTags',
    )

    expect(settingsPlan.type).toBe('jsonPath')
    expect(settingsPlan.fieldsByCollection.get('articles')).toMatchObject({
      jsonColumnPath: 'settings',
      jsonPathSegments: ['variantTags'],
      type: 'jsonPath',
    })
  })

  it('keeps a jsonPath plan valid when the json field is absent from one target collection', () => {
    const extrasPlan = createPlan({ 'extras.flag': { equals: 1 } }).get('extras.flag')

    expect(extrasPlan.type).toBe('jsonPath')
    expect([...extrasPlan.fieldsByCollection.keys()]).toEqual(['articles'])
  })

  it('resolves a json field nested under a group container', () => {
    const nestedPlan = createPlan({ 'meta.settings.approved': { equals: true } }).get(
      'meta.settings.approved',
    )

    expect(nestedPlan.type).toBe('jsonPath')
    expect(nestedPlan.fieldsByCollection.get('articles')).toMatchObject({
      jsonColumnPath: 'meta_settings',
      jsonPathSegments: ['approved'],
    })
  })

  it.each([
    ['a field that is absent from every collection', { unknown: { equals: 'value' } }, 'unknown'],
    [
      'a sub-path of a field that cannot be descended into',
      { 'title.variantTags': { equals: 'value' } },
      'title.variantTags',
    ],
    [
      'a json sub-path that is a real column in another collection',
      { 'config.mode': { equals: 'value' } },
      'config.mode',
    ],
    [
      'a sub-path of a localized json field',
      { 'localizedSettings.approved': { equals: true } },
      'localizedSettings.approved',
    ],
    ['incompatible scalar field types', { variantValue: { equals: 'value' } }, 'variantValue'],
    [
      'select fields with differently ordered option values',
      { variantSelectMismatch: { equals: 'available' } },
      'variantSelectMismatch',
    ],
    [
      'radio fields with differently ordered option values',
      { variantRadioMismatch: { equals: 'available' } },
      'variantRadioMismatch',
    ],
    [
      'a select field mixed with a radio field',
      { variantKind: { equals: 'available' } },
      'variantKind',
    ],
  ] as const)('marks %s as invalid', (_description, where, schemaPath) => {
    expect(createPlan(where as Where).get(schemaPath)).toMatchObject({ type: 'invalid' })
  })

  it('marks both schema paths as invalid when they resolve to the same flattened column path', () => {
    const plan = createPlan({
      'details.status': { equals: 'available' },
      details_status: { equals: 'available' },
    })

    expect(plan.get('details.status')).toMatchObject({
      columnPath: 'details_status',
      type: 'invalid',
    })
    expect(plan.get('details_status')).toMatchObject({
      columnPath: 'details_status',
      type: 'invalid',
    })
  })

  it('marks a json sub-path as invalid when the json column is missing from the table', () => {
    const tableWithoutSettings = sqliteTable('articles_without_settings', {
      id: integer('id').primaryKey(),
    })
    const adapterWithoutSettings = createAdapter({
      articles: { fields: [{ name: 'settings', type: 'json' }], table: tableWithoutSettings },
    })
    const plan = createPolymorphicJoinWherePlan({
      adapter: adapterWithoutSettings,
      collections: ['articles'],
      where: { 'settings.approved': { equals: true } },
    })

    expect(plan.get('settings.approved')).toMatchObject({ type: 'invalid' })
  })

  it('marks a configured scalar field as invalid when its table column is missing', () => {
    const tableWithoutTitle = sqliteTable('articles_without_title', {
      id: integer('id').primaryKey(),
    })
    const adapterWithoutTitle = createAdapter({
      articles: { fields: [{ name: 'title', type: 'text' }], table: tableWithoutTitle },
    })
    const plan = createPolymorphicJoinWherePlan({
      adapter: adapterWithoutTitle,
      collections: ['articles'],
      where: { title: { equals: 'available' } },
    })

    expect(plan.get('title')).toMatchObject({ type: 'invalid' })
  })

  it('marks an id path as invalid when a target table has no id column', () => {
    const tableWithoutID = sqliteTable('articles_without_id', {
      title: text('title'),
    })
    const adapterWithoutID = createAdapter({
      articles: { fields: [{ name: 'title', type: 'text' }], table: tableWithoutID },
    })
    const plan = createPolymorphicJoinWherePlan({
      adapter: adapterWithoutID,
      collections: ['articles'],
      where: { id: { equals: 1 } },
    })

    expect(plan.get('id')).toMatchObject({ type: 'invalid' })
  })

  it('marks every requested path as invalid when there are no target collections', () => {
    expect(createPlan({ title: { equals: 'available' } }, []).get('title')).toMatchObject({
      type: 'invalid',
    })
  })

  it('throws a descriptive error when a target collection is not configured', () => {
    expect(() => createPlan({ title: { equals: 'available' } }, ['missing'])).toThrow(
      'Unknown polymorphic join collection "missing"',
    )
  })

  it('throws a descriptive error when a configured collection has no database table', () => {
    const adapterWithoutTable = createAdapter({
      articles: { fields: [{ name: 'title', type: 'text' }], table: articlesTable },
    })

    adapterWithoutTable.tables = {}

    expect(() =>
      createPolymorphicJoinWherePlan({
        adapter: adapterWithoutTable,
        collections: ['articles'],
        where: { title: { equals: 'available' } },
      }),
    ).toThrow('Polymorphic join collection "articles" has no database table')
  })
})
