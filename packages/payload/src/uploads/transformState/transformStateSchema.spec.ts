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
    expect(objectSchema.additionalProperties).toBe(true)
  })
})
