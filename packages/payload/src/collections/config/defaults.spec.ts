import type { PayloadRequest } from '../../types/index.js'
import type { CollectionConfig } from './types.js'

import { describe, expect, it } from 'vitest'

import { addDefaultsToAuthConfig, addDefaultsToCollectionConfig } from './defaults.js'

describe('addDefaultsToAuthConfig', () => {
  it('should default the forgot password request interval to 15 seconds', () => {
    const auth = addDefaultsToAuthConfig({})

    expect(auth.forgotPassword.minRequestInterval).toBe(15000)
  })

  it('should allow the forgot password request interval to be disabled', () => {
    const auth = addDefaultsToAuthConfig({
      forgotPassword: {
        minRequestInterval: 0,
      },
    })

    expect(auth.forgotPassword.minRequestInterval).toBe(0)
  })
})

const req = {} as PayloadRequest

describe('addDefaultsToCollectionConfig', () => {
  it('should default versions to true when not specified', () => {
    const collection: CollectionConfig = {
      slug: 'posts',
      fields: [],
    }

    const result = addDefaultsToCollectionConfig(collection)

    expect(result.versions).toBe(true)
  })

  it('should preserve explicit versions: false', () => {
    const collection: CollectionConfig = {
      slug: 'users',
      fields: [],
      versions: false,
    }

    const result = addDefaultsToCollectionConfig(collection)

    expect(result.versions).toBe(false)
  })

  it('should preserve explicit versions object config', () => {
    const collection: CollectionConfig = {
      slug: 'posts',
      fields: [],
      versions: { drafts: true, maxPerDoc: 50 },
    }

    const result = addDefaultsToCollectionConfig(collection)

    expect(result.versions).toEqual({ drafts: true, maxPerDoc: 50 })
  })

  it('should preserve explicit versions: true', () => {
    const collection: CollectionConfig = {
      slug: 'posts',
      fields: [],
      versions: true,
    }

    const result = addDefaultsToCollectionConfig(collection)

    expect(result.versions).toBe(true)
  })

  it('should preserve an explicit readVersions access function', () => {
    const readVersions = () => true
    const result = addDefaultsToCollectionConfig({
      slug: 'posts',
      fields: [],
      access: { read: () => false, readVersions },
    })

    expect(result.access?.readVersions).toBe(readVersions)
  })

  it.each([true, false])(
    'should pass through a %s result from read access to readVersions',
    async (readResult) => {
      const result = addDefaultsToCollectionConfig({
        slug: 'posts',
        fields: [],
        access: { read: async () => readResult },
      })

      await expect(result.access!.readVersions!({ req })).resolves.toBe(readResult)
    },
  )

  it('should translate inherited read queries to version fields', async () => {
    const result = addDefaultsToCollectionConfig({
      slug: 'posts',
      fields: [],
      access: {
        read: async () => ({
          or: [{ id: { equals: 'post-id' } }, { owner: { equals: 'user-id' } }],
        }),
      },
    })

    await expect(result.access!.readVersions!({ req })).resolves.toEqual({
      or: [{ parent: { equals: 'post-id' } }, { 'version.owner': { equals: 'user-id' } }],
    })
  })
})
