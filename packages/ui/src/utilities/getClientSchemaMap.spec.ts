import type { ClientConfig, FieldSchemaMap, Payload } from 'payload'

import { createUnauthenticatedClientConfig } from 'payload'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getClientSchemaMap } from './getClientSchemaMap.js'

const payload = {
  config: { db: { defaultIDType: 'number' } },
  importMap: {},
} as unknown as Payload

const i18n = {
  language: 'en',
  t: (key: string) => key,
}

const schemaMap = new Map() as FieldSchemaMap

const createConfig = ({
  collectionFields,
  collectionSlug,
}: {
  collectionFields?: ClientConfig['collections'][number]['fields']
  collectionSlug: string
}): ClientConfig =>
  ({
    admin: { user: collectionSlug },
    blocks: [],
    blocksMap: {},
    collections: [
      {
        auth: {},
        fields: collectionFields,
        slug: collectionSlug,
      },
    ],
    globals: [],
  }) as ClientConfig

const createUnauthenticatedConfig = (clientConfig: ClientConfig): ClientConfig =>
  createUnauthenticatedClientConfig({ clientConfig }) as ClientConfig

describe('getClientSchemaMap', () => {
  beforeEach(() => {
    global._payload_doNotCacheClientSchemaMap = true
  })

  afterEach(() => {
    global._payload_clientSchemaMap = null
    global._payload_doNotCacheClientSchemaMap = true
  })

  it('should keep limited and full schema maps separate', () => {
    const collectionSlug = 'limited-first'
    const fullConfig = createConfig({
      collectionFields: [{ name: 'email', type: 'email' }],
      collectionSlug,
    })

    const limitedMap = getClientSchemaMap({
      collectionSlug,
      config: createUnauthenticatedConfig(fullConfig),
      i18n,
      payload,
      schemaMap,
    })
    const fullMap = getClientSchemaMap({
      collectionSlug,
      config: fullConfig,
      i18n,
      payload,
      schemaMap,
    })

    expect(limitedMap.has(`${collectionSlug}.email`)).toBe(false)
    expect(fullMap.has(`${collectionSlug}.email`)).toBe(true)
  })

  it('should keep full and limited schema maps separate', () => {
    const collectionSlug = 'full-first'
    const fullConfig = createConfig({
      collectionFields: [{ name: 'email', type: 'email' }],
      collectionSlug,
    })

    const fullMap = getClientSchemaMap({
      collectionSlug,
      config: fullConfig,
      i18n,
      payload,
      schemaMap,
    })
    const limitedMap = getClientSchemaMap({
      collectionSlug,
      config: createUnauthenticatedConfig(fullConfig),
      i18n,
      payload,
      schemaMap,
    })

    expect(fullMap.has(`${collectionSlug}.email`)).toBe(true)
    expect(limitedMap.has(`${collectionSlug}.email`)).toBe(false)
  })
})
