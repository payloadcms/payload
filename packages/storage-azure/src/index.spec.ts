import type { Config } from 'payload'

import { describe, expect, it } from 'vitest'

import { azureStorage } from './index.js'

const createConfig = (): Config =>
  ({
    collections: [
      {
        slug: 'media',
        fields: [],
        upload: true,
      },
      {
        slug: 'direct-media',
        fields: [],
        upload: { allowRestrictedFileTypes: true },
      },
    ],
    secret: 'test-secret',
  }) as unknown as Config

describe('azureStorage client uploads', () => {
  it('should register direct uploads only for explicit opt-out collections', () => {
    const config = azureStorage({
      allowContainerCreate: false,
      baseURL: 'https://account.blob.core.windows.net',
      clientUploads: true,
      collections: {
        'direct-media': true,
        media: true,
      },
      connectionString: 'UseDevelopmentStorage=true',
      containerName: 'media',
    })(createConfig()) as Config

    const providers = config.admin?.components?.providers ?? []
    const providerCollections = providers
      .map((provider) => {
        const clientProps = (provider as { clientProps?: { collectionSlug?: unknown } }).clientProps
        return typeof clientProps?.collectionSlug === 'string'
          ? clientProps.collectionSlug
          : undefined
      })
      .filter(Boolean)

    expect(providerCollections).toEqual(['direct-media'])
  })
})

const getMediaFieldNames = (config: Config): string[] =>
  (config.collections?.find((collection) => collection.slug === 'media')?.fields ?? []).flatMap(
    (field) => ('name' in field ? [field.name] : []),
  )

describe('azureStorage when disabled', () => {
  it('should insert the prefix and object key fields when alwaysInsertFields is true', () => {
    const config = azureStorage({
      allowContainerCreate: false,
      alwaysInsertFields: true,
      baseURL: 'https://account.blob.core.windows.net',
      collections: {
        media: true,
      },
      connectionString: 'UseDevelopmentStorage=true',
      containerName: 'media',
      enabled: false,
    })(createConfig()) as Config

    expect(getMediaFieldNames(config)).toEqual(expect.arrayContaining(['prefix', '_objectKey']))
  })

  it('should not insert fields when alwaysInsertFields is not set', () => {
    const config = azureStorage({
      allowContainerCreate: false,
      baseURL: 'https://account.blob.core.windows.net',
      collections: {
        media: true,
      },
      connectionString: 'UseDevelopmentStorage=true',
      containerName: 'media',
      enabled: false,
    })(createConfig()) as Config

    expect(getMediaFieldNames(config)).toEqual([])
  })
})
