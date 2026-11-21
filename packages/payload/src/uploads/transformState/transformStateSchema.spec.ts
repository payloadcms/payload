import type { JSONSchema4 } from 'json-schema'
import { compile } from 'json-schema-to-typescript'
import { describe, expect, it } from 'vitest'

import type { Config } from '../../config/types.js'

import { sanitizeConfig } from '../../config/sanitize.js'
import { configToJSONSchema } from '../../utilities/configToJSONSchema.js'

const builtInKeys = [
  'clip',
  'crop',
  'encoding',
  'flip',
  'focalPoint',
  'metadataPolicy',
  'pageRange',
  'posterFrame',
  'resize',
  'rotate',
]

describe('transformStateSchema', () => {
  it('should generate every built-in key with a description and allow other keys', () => {
    // @ts-expect-error partial config
    const config: Config = { collections: [{ slug: 'media', fields: [], upload: true }] }

    const { jsonSchema } = configToJSONSchema(sanitizeConfig(config), 'text')
    const objectSchema = (jsonSchema.$defs?.UploadTransforms?.anyOf as JSONSchema4[])[0]!

    expect(Object.keys(objectSchema.properties!).sort()).toEqual(builtInKeys)
    for (const key of builtInKeys) {
      expect(objectSchema.properties![key]!.description).toBeTruthy()
    }
    // Other (transformer-owned) keys are allowed, typed as JSON values so the
    // generated `_transforms` type stays serialisable (fixes #19783).
    expect(objectSchema.additionalProperties).toStrictEqual({
      $ref: '#/$defs/payload.JsonValue',
    })
  })

  it('should type encoding settings as JSON values, not unknown', () => {
    // @ts-expect-error partial config
    const config: Config = { collections: [{ slug: 'media', fields: [], upload: true }] }

    const { jsonSchema } = configToJSONSchema(sanitizeConfig(config), 'text')
    const objectSchema = (jsonSchema.$defs?.UploadTransforms?.anyOf as JSONSchema4[])[0]!
    const encoding = objectSchema.properties!.encoding as JSONSchema4

    // Was `{ type: 'object' }`, which compiled to `{ [k: string]: unknown }`
    // and broke TanStack Start's createServerFn serialisability check (#19783).
    expect(encoding.additionalProperties).toStrictEqual({
      $ref: '#/$defs/payload.JsonValue',
    })
  })

  it('should type untyped custom transform values as JSON values, not unknown', async () => {
    // @ts-expect-error partial config
    const config: Config = {
      collections: [{ slug: 'media', fields: [], upload: true }],
      upload: {
        transformers: [
          {
            slug: 'test-transformer',
            mimeTypes: ['image/*'],
            transformDefinitions: [
              { key: 'custom', schema: { type: 'object' } },
              {
                key: 'nested',
                schema: { type: 'object', properties: { meta: { type: 'object' } } },
              },
            ],
          },
        ],
      },
    }

    const { jsonSchema } = configToJSONSchema(sanitizeConfig(config), 'text')
    const objectSchema = (jsonSchema.$defs?.UploadTransforms?.anyOf as JSONSchema4[])[0]!

    // A custom definition with an untyped object schema compiled to
    // `{ [k: string]: unknown }`, which is not assignable to the `_transforms`
    // `[k: string]: JsonValue` index signature, so the generated
    // `UploadTransforms` interface failed to compile.
    expect((objectSchema.properties!.custom as JSONSchema4).additionalProperties).toStrictEqual({
      $ref: '#/$defs/payload.JsonValue',
    })
    expect(
      ((objectSchema.properties!.nested as JSONSchema4).properties!.meta as JSONSchema4)
        .additionalProperties,
    ).toStrictEqual({ $ref: '#/$defs/payload.JsonValue' })

    const compiled = await compile(jsonSchema, 'Config', {
      bannerComment: '',
      style: { singleQuote: true },
      unreachableDefinitions: true,
      cwd: process.cwd(),
    })

    expect(compiled).toMatch(/custom\?: \{\s*\[k: string\]: JsonValue;?\s*\}/)
    // The `nested` shape keeps its declared `meta` property, and its
    // open-ended values are JSON values too — an object without an
    // `additionalProperties` rule compiles with a `[k: string]: unknown`
    // index, which would break the `_transforms` index signature.
    expect(compiled).toMatch(
      /nested\?: \{\s*meta\?: \{\s*\[k: string\]: JsonValue;?\s*\};?\s*\[k: string\]: JsonValue;?\s*\}/,
    )
  })

  it('should preserve boolean schemas, rewrite patternProperties, and map items: true to JsonValue', async () => {
    // @ts-expect-error partial config
    const config: Config = {
      collections: [{ slug: 'media', fields: [], upload: true }],
      upload: {
        transformers: [
          {
            slug: 'test-transformer',
            mimeTypes: ['image/*'],
            transformDefinitions: [
              {
                key: 'blockedCase',
                schema: {
                  type: 'object',
                  properties: { blocked: false },
                  additionalProperties: false,
                },
              },
              {
                key: 'patternCase',
                schema: { type: 'object', patternProperties: { '^x-': { type: 'object' } } },
              },
              {
                key: 'patternOnlyCase',
                schema: { patternProperties: { '^x-': { type: 'object' } } },
              },
              { key: 'itemsTrue', schema: { type: 'array', items: true } },
              { key: 'itemsFalse', schema: { type: 'array', items: false } },
            ],
          },
        ],
      },
    }

    const { jsonSchema } = configToJSONSchema(sanitizeConfig(config), 'text')
    const objectSchema = (jsonSchema.$defs?.UploadTransforms?.anyOf as JSONSchema4[])[0]!
    const props = objectSchema.properties!

    // A `false` property schema prohibits the key at runtime, so the
    // generated schema must keep it: replacing it with a JsonValue
    // reference would let the generated type permit the key.
    expect(((props.blockedCase as JSONSchema4).properties as any)?.blocked).toBe(false)
    // A pattern value such as `{ type: 'object' }` is rewritten like a
    // declared property, so it no longer compiles to an unknown-valued
    // dictionary that is not assignable to JsonValue.
    expect(
      ((props.patternCase as JSONSchema4).patternProperties as any)?.['^x-'].additionalProperties,
    ).toStrictEqual({ $ref: '#/$defs/payload.JsonValue' })
    // The same rewrite must happen when the schema declares only
    // `patternProperties`, with no `type: 'object'` — without it, the
    // unconstrained-schema guard returns the schema with a parent
    // JsonValue reference and never recurses into the pattern values.
    expect(
      ((props.patternOnlyCase as JSONSchema4).patternProperties as any)?.['^x-']
        .additionalProperties,
    ).toStrictEqual({ $ref: '#/$defs/payload.JsonValue' })
    // `items: true` accepts any value, like an omitted `items`, so it maps
    // to JsonValue; `items: false` stays, since it generates `never[]`,
    // which is assignable to the `_transforms` index signature.
    expect((props.itemsTrue as JSONSchema4).items).toStrictEqual({
      $ref: '#/$defs/payload.JsonValue',
    })
    expect((props.itemsFalse as JSONSchema4).items).toBe(false)

    const compiled = await compile(jsonSchema, 'Config', {
      bannerComment: '',
      style: { singleQuote: true },
      unreachableDefinitions: true,
      cwd: process.cwd(),
    })

    expect(compiled).toMatch(/blocked\?: never/)
    expect(compiled).toMatch(/itemsTrue\?: JsonValue\[\]/)
    expect(compiled).toMatch(/itemsFalse\?: never\[\]/)
  })
})
