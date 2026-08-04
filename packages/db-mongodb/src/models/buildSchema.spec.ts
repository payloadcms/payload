import type { Config, SanitizedConfig } from 'payload'

import { sanitizeConfig } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { buildSchema } from './buildSchema.js'

let payload: any

describe('buildSchema unique + localized defaultValue', () => {
  beforeAll(() => {
    const config: SanitizedConfig = sanitizeConfig({
      localization: {
        defaultLocale: 'en',
        fallback: true,
        locales: ['en', 'es'],
      },
    } as Config)

    payload = {
      collections: {},
      config,
      db: {},
    }
  })

  it('does not carry the static defaultValue on a unique localized relationship field', () => {
    const schema = buildSchema({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'uniqueLocalizedRelationship',
          type: 'relationship',
          defaultValue: '000000000000000000000001',
          localized: true,
          relationTo: 'some-collection',
          unique: true,
        },
      ],
      payload,
    })

    expect(schema.path('uniqueLocalizedRelationship.en').options.default).toBeUndefined()
    expect(schema.path('uniqueLocalizedRelationship.es').options.default).toBeUndefined()
  })

  it('does not carry the static defaultValue on a unique localized hasMany relationship field', () => {
    const schema = buildSchema({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'uniqueLocalizedHasManyRelationship',
          type: 'relationship',
          defaultValue: ['000000000000000000000001'],
          hasMany: true,
          localized: true,
          relationTo: 'some-collection',
          unique: true,
        },
      ],
      payload,
    })

    expect(schema.path('uniqueLocalizedHasManyRelationship.en').options.default).toBeUndefined()
    expect(schema.path('uniqueLocalizedHasManyRelationship.es').options.default).toBeUndefined()
  })

  it('does not carry the static defaultValue on a unique localized upload field', () => {
    const schema = buildSchema({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'uniqueLocalizedUpload',
          type: 'upload',
          defaultValue: '000000000000000000000001',
          localized: true,
          relationTo: 'some-upload-collection',
          unique: true,
        },
      ],
      payload,
    })

    expect(schema.path('uniqueLocalizedUpload.en').options.default).toBeUndefined()
    expect(schema.path('uniqueLocalizedUpload.es').options.default).toBeUndefined()
  })

  it('does not carry the static defaultValue on a unique localized hasMany select field', () => {
    const schema = buildSchema({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'uniqueLocalizedHasManySelect',
          type: 'select',
          defaultValue: ['a'],
          hasMany: true,
          localized: true,
          options: ['a', 'b'],
          unique: true,
        },
      ],
      payload,
    })

    expect(schema.path('uniqueLocalizedHasManySelect.en').options.type[0].default).toBeUndefined()
    expect(schema.path('uniqueLocalizedHasManySelect.es').options.type[0].default).toBeUndefined()
  })

  it('does not carry the static defaultValue on a unique localized point field', () => {
    const schema = buildSchema({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'uniqueLocalizedPoint',
          type: 'point',
          defaultValue: [0, 0],
          localized: true,
          unique: true,
        },
      ],
      payload,
    })

    expect(schema.path('uniqueLocalizedPoint.en.coordinates').options.default).toBeUndefined()
    expect(schema.path('uniqueLocalizedPoint.es.coordinates').options.default).toBeUndefined()
  })

  it('still applies the static defaultValue on a non-unique localized point field', () => {
    const schema = buildSchema({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'localizedPoint',
          type: 'point',
          defaultValue: [0, 0],
          localized: true,
        },
      ],
      payload,
    })

    expect(schema.path('localizedPoint.en.coordinates').options.default).toEqual([0, 0])
  })

  it('still applies the static defaultValue on a non-unique localized relationship field', () => {
    const schema = buildSchema({
      buildSchemaOptions: {},
      configFields: [
        {
          name: 'localizedRelationship',
          type: 'relationship',
          defaultValue: '000000000000000000000001',
          localized: true,
          relationTo: 'some-collection',
        },
      ],
      payload,
    })

    expect(schema.path('localizedRelationship.en').options.default).toBe('000000000000000000000001')
  })
})
