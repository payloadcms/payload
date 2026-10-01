import type { CollectionConfig, Field } from '../index.js'

import { describe, expect, it } from 'vitest'

import { injectBranchFields } from './injectBranchFields.js'

const buildCollection = ({
  fields,
  indexes,
  upload,
}: {
  fields: Field[]
  indexes?: CollectionConfig['indexes']
  upload?: CollectionConfig['upload']
}): CollectionConfig => ({
  fields,
  indexes,
  slug: 'articles',
  upload,
})

describe('injectBranchFields', () => {
  it('should preserve optional unique-field semantics when adding branch scope', () => {
    const collection = buildCollection({
      fields: [{ name: 'slug', type: 'text', unique: true }],
    })

    injectBranchFields(collection)

    expect(collection.fields[0]).toMatchObject({ name: 'slug', unique: false })
    expect(collection.indexes).toContainEqual({
      fields: ['slug', '_branch'],
      requireExists: ['slug'],
      unique: true,
    })
  })

  it('should keep required unique fields as non-partial branch indexes', () => {
    const collection = buildCollection({
      fields: [{ name: 'slug', required: true, type: 'text', unique: true }],
    })

    injectBranchFields(collection)

    expect(collection.indexes).toContainEqual({
      fields: ['slug', '_branch'],
      unique: true,
    })
  })

  it('should not add branch scope twice to a developer unique index', () => {
    const collection = buildCollection({
      fields: [{ name: 'slug', type: 'text' }],
      indexes: [{ fields: ['slug', '_branch'], unique: true }],
    })

    injectBranchFields(collection)

    expect(collection.indexes).toContainEqual({
      fields: ['slug', '_branch'],
      unique: true,
    })
    expect(collection.indexes).not.toContainEqual({
      fields: ['slug', '_branch', '_branch'],
      unique: true,
    })
  })
})
