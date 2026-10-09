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

const articlesTable = sqliteTable('join_articles', {
  id: integer('id').primaryKey(),
  details_status: text('details_status_flat'),
  score: integer('score'),
  status: text('status'),
  title: text('title'),
  variantSelect: text('variant_select'),
  variantValue: text('variant_value'),
})

const notesTable = sqliteTable('join_notes', {
  id: integer('id').primaryKey(),
  details_status: text('details_status_flat'),
  status: text('status'),
  title: text('title'),
  variantSelect: integer('variant_select'),
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
  { name: 'variantSelect', options: ['available'], type: 'select' },
  { name: 'variantValue', type: 'text' },
  { localized: true, name: 'localizedTitle', type: 'text' },
  {
    name: 'entries',
    type: 'array',
    fields: [{ hasMany: true, name: 'tags', options: ['available'], type: 'select' }],
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
  { name: 'variantSelect', options: ['available'], type: 'select' },
  { name: 'variantValue', type: 'number' },
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

const createAdapter = (fixtures: Record<string, CollectionFixture>): DrizzleAdapter => {
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

  return {
    idType: 'serial',
    payload: { collections },
    tableNameMap,
    tables,
  } as unknown as DrizzleAdapter
}

const adapter = createAdapter({
  articles: { fields: articleFields, table: articlesTable },
  notes: { fields: noteFields, table: notesTable },
})

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

  it.each([
    ['a field that is absent from every collection', { unknown: { equals: 'value' } }, 'unknown'],
    ['incompatible scalar field types', { variantValue: { equals: 'value' } }, 'variantValue'],
    ['a localized field', { localizedTitle: { equals: 'value' } }, 'localizedTitle'],
    ['a field stored in array rows', { 'entries.tags': { equals: 'value' } }, 'entries.tags'],
    [
      'a field stored in block rows',
      { 'content.hero.tags': { equals: 'value' } },
      'content.hero.tags',
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
