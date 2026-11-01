import type { I18nClient } from '@payloadcms/translations'
import type { ClientField, ClientFieldSchemaMap, FieldSchemaMap, Payload } from 'payload'

import { describe, expect, it } from 'vitest'

import type { SanitizedServerEditorConfig } from '../lexical/config/types.js'

import { initLexicalFeatures } from './initLexicalFeatures.js'

const urlField: ClientField = { name: 'url', type: 'text' }

const sanitizedEditorConfig = {
  resolvedFeatureMap: new Map([
    ['link', { key: 'link', generateSchemaMap: () => null, order: 1 }],
    ['blocks', { key: 'blocks', generateSchemaMap: () => null, order: 2 }],
  ]),
} as unknown as SanitizedServerEditorConfig

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

/**
 * Builds a client schema map with the link feature sub-fields of each rich text field
 */
const createClientFieldSchemaMap = (richTextFieldCount: number): ClientFieldSchemaMap => {
  const clientFieldSchemaMap: ClientFieldSchemaMap = new IterationCountingMap()

  for (let index = 0; index < richTextFieldCount; index++) {
    const featurePath = `pages.content${index}.lexical_internal_feature.link`

    clientFieldSchemaMap.set(`${featurePath}.fields`, { fields: [urlField] })
    clientFieldSchemaMap.set(`${featurePath}.fields.url`, urlField)
  }

  return clientFieldSchemaMap
}

const getFeatureClientSchemaMap = ({
  clientFieldSchemaMap,
  schemaPath,
}: {
  clientFieldSchemaMap: ClientFieldSchemaMap
  schemaPath: string
}) =>
  initLexicalFeatures({
    clientFieldSchemaMap,
    fieldSchemaMap: new Map() as FieldSchemaMap,
    i18n: {} as I18nClient,
    path: schemaPath.replace('pages.', ''),
    payload: { importMap: {} } as unknown as Payload,
    sanitizedEditorConfig,
    schemaPath,
  }).featureClientSchemaMap

const countClientFieldSchemaMapIterations = (richTextFieldCount: number): number => {
  const clientFieldSchemaMap = createClientFieldSchemaMap(richTextFieldCount)

  for (let index = 0; index < richTextFieldCount; index++) {
    getFeatureClientSchemaMap({ clientFieldSchemaMap, schemaPath: `pages.content${index}` })
  }

  return (clientFieldSchemaMap as IterationCountingMap<string, unknown>).iterationCount
}

describe('initLexicalFeatures', () => {
  it('should not read the client field schema map once per rich text field', () => {
    expect(countClientFieldSchemaMapIterations(50)).toBe(countClientFieldSchemaMapIterations(1))
  })

  it('should include the sub-fields of rich text fields nested in a feature', () => {
    const clientFieldSchemaMap = createClientFieldSchemaMap(2)
    const nestedPath =
      'pages.content0.lexical_internal_feature.blocks.lexical_blocks.quote.fields.body'
    const nestedRichTextField: ClientField = { name: 'body', type: 'richText' }

    clientFieldSchemaMap.set(nestedPath, nestedRichTextField)
    clientFieldSchemaMap.set(`${nestedPath}.lexical_internal_feature.link.fields`, {
      fields: [urlField],
    })

    expect(
      getFeatureClientSchemaMap({ clientFieldSchemaMap, schemaPath: 'pages.content0' }),
    ).toEqual({
      blocks: {
        [nestedPath]: [nestedRichTextField],
        [`${nestedPath}.lexical_internal_feature.link.fields`]: [urlField],
      },
      link: {
        'pages.content0.lexical_internal_feature.link.fields': [urlField],
        'pages.content0.lexical_internal_feature.link.fields.url': [urlField],
      },
    })
  })
})
