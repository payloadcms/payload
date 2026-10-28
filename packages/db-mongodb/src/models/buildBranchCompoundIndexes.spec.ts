import type { Field, Payload, SanitizedCompoundIndex } from 'payload'

import { branchField, flattenAllFields } from 'payload'
import { expect, test } from 'vitest'

import { buildSchema } from './buildSchema.js'

test('should keep required localized unique values scoped by branch and locale without an existence filter', () => {
  const fields: Field[] = [
    { name: 'slug', type: 'text', localized: true, required: true },
    { name: branchField, type: 'text' },
  ]
  const flattenedFields = flattenAllFields({ fields })
  const index: SanitizedCompoundIndex = {
    fields: flattenedFields.map((field) => ({
      field,
      localizedPath: field.localized ? `${field.name}.<locale>` : field.name,
      path: field.name,
      pathHasLocalized: Boolean(field.localized),
    })),
    unique: true,
  }
  const payload = {
    config: {
      localization: { locales: [{ code: 'en' }, { code: 'de' }], localeCodes: ['en', 'de'] },
    },
    db: {},
  } as unknown as Payload
  const schema = buildSchema({
    buildSchemaOptions: {},
    compoundIndexes: [index],
    configFields: fields,
    payload,
  })

  for (const locale of ['en', 'de']) {
    expect(schema.indexes()).toContainEqual([
      { [`slug.${locale}`]: 1, [branchField]: 1 },
      expect.objectContaining({ unique: true }),
    ])
  }
})
