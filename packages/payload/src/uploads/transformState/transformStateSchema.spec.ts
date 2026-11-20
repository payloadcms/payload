import type { JSONSchema4 } from 'json-schema'

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
    expect(objectSchema.additionalProperties).toStrictEqual({ $ref: '#/$defs/JsonValue' })
  })

  it('should type encoding settings as JSON values, not unknown', () => {
    // @ts-expect-error partial config
    const config: Config = { collections: [{ slug: 'media', fields: [], upload: true }] }

    const { jsonSchema } = configToJSONSchema(sanitizeConfig(config), 'text')
    const objectSchema = (jsonSchema.$defs?.UploadTransforms?.anyOf as JSONSchema4[])[0]!
    const encoding = objectSchema.properties!.encoding as JSONSchema4

    // Was `{ type: 'object' }`, which compiled to `{ [k: string]: unknown }`
    // and broke TanStack Start's createServerFn serialisability check (#19783).
    expect(encoding.additionalProperties).toStrictEqual({ $ref: '#/$defs/JsonValue' })
  })
})
