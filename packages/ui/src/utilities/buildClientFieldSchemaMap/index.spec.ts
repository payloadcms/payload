import type { I18n } from '@payloadcms/translations'
import type {
  ClientConfig,
  ClientField,
  FieldSchemaMap,
  Payload,
  RichTextAdapter,
  RichTextFieldClient,
} from 'payload'

import { describe, expect, it } from 'vitest'

import { buildClientFieldSchemaMap } from './index.js'

const payload = {
  config: { db: { defaultIDType: 'number' } },
  importMap: {},
} as unknown as Payload

const i18n = {
  language: 'en',
  t: (key: string) => key,
} as unknown as I18n

const createConfig = (fields: ClientField[]): ClientConfig =>
  ({
    collections: [{ slug: 'pages', fields }],
    globals: [],
  }) as unknown as ClientConfig

const createRichTextFields = (count: number): RichTextFieldClient[] =>
  Array.from({ length: count }, (_, index) => ({ name: `content${index}`, type: 'richText' }))

/**
 * Builds a server schema map with the entries a rich text editor adds for its sub-fields
 */
const createSchemaMap = (richTextFields: RichTextFieldClient[]): FieldSchemaMap => {
  const schemaMap: FieldSchemaMap = new Map()

  for (const field of richTextFields) {
    schemaMap.set(`pages.${field.name}`, { name: field.name, type: 'richText' })
    schemaMap.set(`pages.${field.name}.lexical_internal_feature.link.fields`, {
      fields: [{ name: 'url', type: 'text' }],
    })
    schemaMap.set(`pages.${field.name}.lexical_internal_feature.link.fields.url`, {
      name: 'url',
      type: 'text',
    })
  }

  return schemaMap
}

class IterationCountingMap<K, V> extends Map<K, V> {
  iterationCount = 0

  override entries() {
    this.iterationCount++
    return super.entries()
  }

  override [Symbol.iterator]() {
    this.iterationCount++
    return super[Symbol.iterator]()
  }
}

const countSchemaMapIterations = (richTextFieldCount: number): number => {
  const fields = createRichTextFields(richTextFieldCount)
  const schemaMap = new IterationCountingMap(createSchemaMap(fields))

  buildClientFieldSchemaMap({
    collectionSlug: 'pages',
    config: createConfig(fields),
    i18n,
    payload,
    schemaMap,
  })

  return schemaMap.iterationCount
}

describe('buildClientFieldSchemaMap', () => {
  it('should add the sub-fields of each rich text field to the client schema map', () => {
    const fields = createRichTextFields(2)

    const { clientFieldSchemaMap } = buildClientFieldSchemaMap({
      collectionSlug: 'pages',
      config: createConfig(fields),
      i18n,
      payload,
      schemaMap: createSchemaMap(fields),
    })

    expect([...clientFieldSchemaMap.keys()]).toEqual([
      'pages',
      'pages.content0',
      'pages.content0.lexical_internal_feature.link.fields',
      'pages.content0.lexical_internal_feature.link.fields.url',
      'pages.content1',
      'pages.content1.lexical_internal_feature.link.fields',
      'pages.content1.lexical_internal_feature.link.fields.url',
    ])
  })

  it('should not add sub-fields of another rich text field that shares a name prefix', () => {
    const fields: RichTextFieldClient[] = [
      { name: 'content', type: 'richText' },
      { name: 'contentExtra', type: 'richText' },
    ]

    // Only `content` is in the client config, so any `contentExtra` entry must come from `content`
    const { clientFieldSchemaMap } = buildClientFieldSchemaMap({
      collectionSlug: 'pages',
      config: createConfig([fields[0]!]),
      i18n,
      payload,
      schemaMap: createSchemaMap(fields),
    })

    expect([...clientFieldSchemaMap.keys()]).toEqual([
      'pages',
      'pages.content',
      'pages.content.lexical_internal_feature.link.fields',
      'pages.content.lexical_internal_feature.link.fields.url',
    ])
  })

  it('should add sub-fields of rich text fields nested in rich text sub-fields', () => {
    const fields = createRichTextFields(1)
    const schemaMap = createSchemaMap(fields)

    schemaMap.set('pages.content0.lexical_blocks.quote.fields.body', {
      name: 'body',
      type: 'richText',
      editor: {} as RichTextAdapter,
    })
    schemaMap.set('pages.content0.lexical_blocks.quote.fields.body.lexical_internal_feature.link', {
      fields: [{ name: 'url', type: 'text' }],
    })

    const { clientFieldSchemaMap } = buildClientFieldSchemaMap({
      collectionSlug: 'pages',
      config: createConfig(fields),
      i18n,
      payload,
      schemaMap,
    })

    expect(
      clientFieldSchemaMap.get('pages.content0.lexical_blocks.quote.fields.body'),
    ).toMatchObject({ name: 'body', type: 'richText' })
    expect(
      clientFieldSchemaMap.has(
        'pages.content0.lexical_blocks.quote.fields.body.lexical_internal_feature.link',
      ),
    ).toBe(true)
  })

  it('should not read the schema map once per rich text field', () => {
    expect(countSchemaMapIterations(50)).toBe(countSchemaMapIterations(1))
  })
})
