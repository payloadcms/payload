import { describe, expect, it } from 'vitest'
import { initLexicalFeatures } from './initLexicalFeatures.js'

describe('client feature schema selection', () => {
  it.each(['blocks', 'link', 'upload', 'custom'])(
    'should preserve descendants for non-opted-in %s features',
    (key) => {
      const prefix = `pages.body.lexical_internal_feature.${key}`
      const fields = [{ name: 'rel', type: 'text' }]
      const result = initLexicalFeatures({
        schemaPath: 'pages.body',
        clientFieldSchemaMap: new Map([
          [`${prefix}.fields`, { fields }],
          [`${prefix}.fields.rel`, fields[0]],
        ]),
        sanitizedEditorConfig: {
          resolvedFeatureMap: new Map([
            [key, { key, order: 0, generateSchemaMap: () => new Map() }],
          ]),
        },
      } as any)
      expect(Object.keys(result.featureClientSchemaMap[key])).toHaveLength(2)
    },
  )

  it('should use declared keys without regenerating schemas or dropping nested definitions', () => {
    const prefix = 'pages.body.lexical_internal_feature.blocks'
    const fields = [
      { name: 'items', type: 'array', fields: [{ name: 'content', type: 'richText' }] },
    ]
    const result = initLexicalFeatures({
      schemaPath: 'pages.body',
      clientFieldSchemaMap: new Map([
        [`${prefix}.fields`, { fields }],
        [`${prefix}.fields.items`, fields[0]],
      ]),
      sanitizedEditorConfig: {
        resolvedFeatureMap: new Map([
          [
            'blocks',
            {
              key: 'blocks',
              order: 0,
              clientSchemaMapKeys: ['fields'],
              generateSchemaMap: () => {
                throw new Error('must not be called again')
              },
            },
          ],
        ]),
      },
    } as any)
    expect(Object.keys(result.featureClientSchemaMap.blocks)).toEqual([`${prefix}.fields`])
    expect(result.featureClientSchemaMap.blocks[`${prefix}.fields`]).toBe(fields)
  })
})
