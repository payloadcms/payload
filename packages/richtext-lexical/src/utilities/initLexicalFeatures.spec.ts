import type { I18nClient } from '@payloadcms/translations'
import type { ClientFieldSchemaMap, FieldSchemaMap, Payload } from 'payload'

import { describe, expect, it } from 'vitest'

import type { SanitizedServerEditorConfig } from '../lexical/config/types.js'

import { initLexicalFeatures } from './initLexicalFeatures.js'

const payload = { importMap: {} } as unknown as Payload

const i18n = { language: 'en', t: (key: string) => key } as unknown as I18nClient

const sanitizedEditorConfig = {
  resolvedFeatureMap: new Map([
    ['blocks', { generateSchemaMap: () => null, key: 'blocks', order: 1 }],
    ['link', { generateSchemaMap: () => null, key: 'link', order: 2 }],
  ]),
} as unknown as SanitizedServerEditorConfig

/**
 * Builds a client schema map with the entries a rich text editor adds for its features' sub-fields
 */
const createClientFieldSchemaMap = (richTextFieldCount: number): ClientFieldSchemaMap => {
  const clientFieldSchemaMap: ClientFieldSchemaMap = new Map()

  for (let index = 0; index < richTextFieldCount; index++) {
    const path = `pages.content${index}`

    clientFieldSchemaMap.set(path, { name: `content${index}`, type: 'richText' })
    clientFieldSchemaMap.set(`${path}.lexical_internal_feature.link.fields`, {
      fields: [{ name: 'url', type: 'text' }],
    })
    clientFieldSchemaMap.set(`${path}.lexical_internal_feature.link.fields.url`, {
      name: 'url',
      type: 'text',
    })
    clientFieldSchemaMap.set(`${path}.lexical_internal_feature.blocks.lexical_blocks.quote`, {
      fields: [{ name: 'body', type: 'richText' }],
    })
  }

  return clientFieldSchemaMap
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

const initFeatures = (clientFieldSchemaMap: ClientFieldSchemaMap, schemaPath: string) =>
  initLexicalFeatures({
    clientFieldSchemaMap,
    fieldSchemaMap: new Map() as FieldSchemaMap,
    i18n,
    path: schemaPath,
    payload,
    sanitizedEditorConfig,
    schemaPath,
  })

describe('initLexicalFeatures', () => {
  it('should add the sub-fields of each feature of the rich text field', () => {
    const clientFieldSchemaMap = createClientFieldSchemaMap(2)

    const { featureClientSchemaMap } = initFeatures(clientFieldSchemaMap, 'pages.content1')

    expect(featureClientSchemaMap).toStrictEqual({
      blocks: {
        'pages.content1.lexical_internal_feature.blocks.lexical_blocks.quote': [
          { name: 'body', type: 'richText' },
        ],
      },
      link: {
        'pages.content1.lexical_internal_feature.link.fields': [{ name: 'url', type: 'text' }],
        'pages.content1.lexical_internal_feature.link.fields.url': [{ name: 'url', type: 'text' }],
      },
    })
  })

  it('should add sub-fields of rich text fields nested in rich text sub-fields', () => {
    const clientFieldSchemaMap = createClientFieldSchemaMap(1)
    const nestedPath = 'pages.content0.lexical_internal_feature.blocks.lexical_blocks.quote.body'

    clientFieldSchemaMap.set(nestedPath, { name: 'body', type: 'richText' })
    clientFieldSchemaMap.set(`${nestedPath}.lexical_internal_feature.link.fields`, {
      fields: [{ name: 'url', type: 'text' }],
    })

    const outer = initFeatures(clientFieldSchemaMap, 'pages.content0')
    const nested = initFeatures(clientFieldSchemaMap, nestedPath)

    expect(Object.keys(outer.featureClientSchemaMap.blocks!)).toStrictEqual([
      'pages.content0.lexical_internal_feature.blocks.lexical_blocks.quote',
      nestedPath,
      `${nestedPath}.lexical_internal_feature.link.fields`,
    ])
    expect(nested.featureClientSchemaMap).toStrictEqual({
      blocks: {},
      link: {
        [`${nestedPath}.lexical_internal_feature.link.fields`]: [{ name: 'url', type: 'text' }],
      },
    })
  })

  it('should not read the client schema map once per rendered rich text field', () => {
    const countIterations = (richTextFieldCount: number): number => {
      const clientFieldSchemaMap = new IterationCountingMap(
        createClientFieldSchemaMap(richTextFieldCount),
      )

      for (let index = 0; index < richTextFieldCount; index++) {
        initFeatures(clientFieldSchemaMap, `pages.content${index}`)
      }

      return clientFieldSchemaMap.iterationCount
    }

    expect(countIterations(50)).toBe(countIterations(1))
  })
})
