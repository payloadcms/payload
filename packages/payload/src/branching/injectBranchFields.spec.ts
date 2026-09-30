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

  it('should add branch scope to nested unique fields', () => {
    const collection = buildCollection({
      fields: [
        {
          name: 'metadata',
          type: 'group',
          fields: [{ name: 'code', type: 'text', unique: true }],
        },
      ],
    })

    injectBranchFields(collection)

    const metadata = collection.fields[0]

    expect(metadata).toMatchObject({ type: 'group' })
    expect(metadata && 'fields' in metadata ? metadata.fields[0] : undefined).toMatchObject({
      name: 'code',
      unique: false,
    })
    expect(collection.indexes).toContainEqual({
      fields: ['metadata.code', '_branch'],
      requireExists: ['metadata.code'],
      unique: true,
    })
  })

  it('should add branch scope to developer unique indexes without changing their constraints', () => {
    const collection = buildCollection({
      fields: [
        { name: 'site', type: 'text' },
        { name: 'slug', type: 'text' },
      ],
      indexes: [
        {
          fields: ['site', 'slug'],
          requireExists: ['slug'],
          unique: true,
        },
        { fields: ['site', 'slug'] },
      ],
    })

    injectBranchFields(collection)

    expect(collection.indexes).toContainEqual({
      fields: ['site', 'slug', '_branch'],
      requireExists: ['slug'],
      unique: true,
    })
    expect(collection.indexes).toContainEqual({ fields: ['site', 'slug'] })
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

  it('should add branch scope to a custom upload filename index', () => {
    const collection = buildCollection({
      fields: [{ name: 'prefix', type: 'text' }],
      upload: { filenameCompoundIndex: ['filename', 'prefix'] },
    })

    injectBranchFields(collection)

    expect(collection.upload).toMatchObject({
      filenameCompoundIndex: ['filename', 'prefix', '_branch'],
    })
  })
})
